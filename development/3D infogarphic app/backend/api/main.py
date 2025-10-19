from fastapi import FastAPI, File, UploadFile, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
import uuid
import os
import tempfile
from typing import Dict
import json

# Import pipeline components
try:
    from backend.parser.run_pipeline import load_parsed_json, save_json
    from backend.ai.orchestrator import Orchestrator
    from backend.renderer.renderer import render_scene_to_video
except ImportError:
    # Fallback imports
    from parser.run_pipeline import load_parsed_json, save_json
    from ai.orchestrator import Orchestrator
    from renderer.renderer import render_scene_to_video

app = FastAPI(title="Document to 3D Video Engine")

# In-memory job storage (for demo; use Redis/DB in production)
jobs: Dict[str, Dict] = {}

# Storage directories
UPLOAD_DIR = "uploads"
VIDEO_DIR = "videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VIDEO_DIR, exist_ok=True)

def process_document(job_id: str, file_path: str, output_video: str):
    """Background task to process document to video."""
    try:
        jobs[job_id]["status"] = "processing"

        # Parse document
        if file_path.endswith('.json'):
            parsed = load_parsed_json(file_path)
        else:
            # Assume PDF, but for demo, create mock parsed
            parsed = {
                'projectId': os.path.basename(file_path),
                'tables': [{'source': 'api', 'tableId': 'table-1', 'columns': ['Year', 'Value'], 'rows': [[2020, 10], [2021, 15]]}],
                'objects': [{'id': 'obj-1', 'type': 'barChart3D', 'dataRef': 'table-1', 'position': [0, 0, 0]}]
            }

        # Orchestrate
        orch = Orchestrator()
        scene = orch.run(parsed)

        # Save scene for frontend
        scene_path = os.path.join(UPLOAD_DIR, f"{job_id}_scene.json")
        save_json(scene, scene_path)

        # Render video (mock server URL)
        # For demo, assume frontend served at localhost:8000
        server_url = "http://127.0.0.1:8000/"  # Would need to start server separately
        render_scene_to_video(server_url, output_video, duration=5.0, fps=30)

        jobs[job_id]["status"] = "completed"
        jobs[job_id]["video_path"] = output_video

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)

@app.post("/process")
async def process_upload(file: UploadFile = File(...), background_tasks: BackgroundTasks = None):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "queued"}

    # Save uploaded file
    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Output video path
    output_video = os.path.join(VIDEO_DIR, f"{job_id}.mp4")

    # Start background processing
    background_tasks.add_task(process_document, job_id, file_path, output_video)

    return {"job_id": job_id, "status": "queued"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.get("/download/{job_id}")
async def download_video(job_id: str):
    if job_id not in jobs or jobs[job_id]["status"] != "completed":
        raise HTTPException(status_code=404, detail="Video not ready")
    video_path = jobs[job_id]["video_path"]
    return FileResponse(video_path, media_type='video/mp4', filename=f"{job_id}.mp4")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)