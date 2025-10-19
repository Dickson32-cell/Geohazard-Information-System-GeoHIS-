"""CLI pipeline: parse input (PDF or JSON) and optionally run Orchestrator to produce scene JSON.

Usage examples:
  python backend/parser/run_pipeline.py --input document.pdf --output scene.json --orchestrate
  python backend/parser/run_pipeline.py --input parsed.json --output scene.json --orchestrate
"""
import argparse
import json
import os
import sys

from parser import extract_tables_from_pdf

# Try to import Orchestrator from known locations
try:
    from backend.ai.orchestrator import Orchestrator
except Exception:
    try:
        from ai.orchestrator import Orchestrator
    except Exception:
        Orchestrator = None


def load_parsed_json(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(obj, path: str):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


def main():
    ap = argparse.ArgumentParser(description='Run parse and optional orchestration to produce scene JSON')
    ap.add_argument('--input', '-i', required=True, help='Input file: PDF or parsed JSON')
    ap.add_argument('--output', '-o', required=True, help='Output scene JSON file')
    ap.add_argument('--orchestrate', action='store_true', help='Run Orchestrator after parsing')
    ap.add_argument('--emit-frontend', action='store_true', help='Also write scene JSON to frontend/preview/scene.json (useful for local preview)')
    ap.add_argument('--frontend-path', default=None, help='Optional path to write scene JSON for frontend preview (overrides default)')
    args = ap.parse_args()

    input_path = args.input
    output_path = args.output

    if not os.path.exists(input_path):
        print(f'Input path not found: {input_path}', file=sys.stderr)
        sys.exit(2)

    # If input is JSON, assume it's already parsed JSON
    if input_path.lower().endswith('.json'):
        parsed = load_parsed_json(input_path)
    else:
        print('Parsing PDF...', file=sys.stderr)
        parsed_tables = extract_tables_from_pdf(input_path)
        parsed = {'projectId': os.path.basename(input_path), 'tables': parsed_tables}

    if args.orchestrate:
        if Orchestrator is None:
            print('Orchestrator is not available (could not import). Skipping orchestration.', file=sys.stderr)
            scene = {'projectId': parsed.get('projectId', 'p-unknown'), 'tables': parsed.get('tables', []), 'objects': []}
        else:
            orch = Orchestrator()
            scene = orch.run(parsed)
    else:
        # Save parsed tables directly as scene-like JSON container.
        # Preserve any 'objects' already present in the parsed input so the frontend preview can render them.
        scene = {
            'projectId': parsed.get('projectId', 'p-unknown'),
            'tables': parsed.get('tables', []),
            'objects': parsed.get('objects', [])
        }

    save_json(scene, output_path)
    print(f'Wrote scene JSON to {output_path}')

    # Optionally emit to the frontend preview directory so the browser preview can pick it up
    if args.emit_frontend:
        # Compute default frontend path relative to repository root if not provided
        if args.frontend_path:
            frontend_path = args.frontend_path
        else:
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            frontend_path = os.path.join(repo_root, 'frontend', 'preview', 'scene.json')

        try:
            os.makedirs(os.path.dirname(frontend_path), exist_ok=True)
            save_json(scene, frontend_path)
            print(f'Also wrote scene JSON for frontend preview to {frontend_path}')
        except Exception as e:
            print(f'Failed to write frontend scene JSON to {frontend_path}: {e}', file=sys.stderr)


if __name__ == '__main__':
    main()
