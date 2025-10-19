"""Headless renderer worker: uses Selenium to render Three.js scene to frames, then FFmpeg to encode video."""
import os
import time
import subprocess
import tempfile
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def render_scene_to_video(scene_url: str, output_video_path: str, duration: float = 5.0, fps: int = 30, width: int = 1920, height: int = 1080):
    """Render a Three.js scene from URL to video file.

    Args:
        scene_url: URL of the preview page (e.g., http://127.0.0.1:8000/)
        output_video_path: Path to output video file (e.g., output.mp4)
        duration: Duration of video in seconds
        fps: Frames per second
        width: Video width
        height: Video height
    """
    # Set up headless Chrome
    options = Options()
    options.add_argument("--headless")
    options.add_argument(f"--window-size={width},{height}")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    driver = webdriver.Chrome(ChromeDriverManager().install(), options=options)

    try:
        # Load the preview page
        driver.get(scene_url)
        driver.set_window_size(width, height)

        # Wait for the scene to load (assume there's a canvas or something)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'viewer'))
        )

        # Inject script to animate the camera for rendering
        driver.execute_script("""
            // Animate camera rotation for video
            const controls = window.controls; // Assume OrbitControls is global
            if (controls) {
                let angle = 0;
                const animate = () => {
                    angle += 0.01;
                    controls.rotateLeft(0.01);
                    requestAnimationFrame(animate);
                };
                animate();
            }
        """)

        # Capture frames
        frame_count = int(duration * fps)
        frame_paths = []

        with tempfile.TemporaryDirectory() as temp_dir:
            for i in range(frame_count):
                # Wait for next frame
                time.sleep(1 / fps)

                # Take screenshot
                frame_path = os.path.join(temp_dir, f"frame_{i:04d}.png")
                driver.save_screenshot(frame_path)
                frame_paths.append(frame_path)

            # Encode to video using FFmpeg
            ffmpeg_cmd = [
                'ffmpeg',
                '-y',  # Overwrite output
                '-framerate', str(fps),
                '-i', os.path.join(temp_dir, 'frame_%04d.png'),
                '-c:v', 'libx264',
                '-pix_fmt', 'yuv420p',
                output_video_path
            ]

            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
            if result.returncode != 0:
                raise RuntimeError(f"FFmpeg failed: {result.stderr}")

    finally:
        driver.quit()

    print(f"Rendered video to {output_video_path}")