"""Simple rule-based agent implementations for M3 scaffolding."""
from typing import Dict, Any, List
import os
import json

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class DocumentAnalyzer:
    """Analyzes parsed document JSON and extracts top findings and narrative order.

    Uses OpenAI LLM if API key is set, otherwise rule-based.
    """

    def run(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        if OPENAI_AVAILABLE and os.getenv('OPENAI_API_KEY'):
            return self._llm_analyze(parsed)
        else:
            return self._rule_analyze(parsed)

    def _llm_analyze(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        client = openai.OpenAI()
        tables = parsed.get('tables', [])
        table_str = json.dumps(tables, indent=2)
        prompt = f"Analyze the following table data from a document. Extract key findings, metrics, and suggest a narrative order for visualization.\n\n{table_str}\n\nRespond in JSON format with 'findings' as a list of dicts with keys: tableId, column, description, importance (1-10)."
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500
        )
        content = response.choices[0].message.content
        if content:
            result = json.loads(content)
        else:
            result = {'findings': []}
        return result

    def _rule_analyze(self, parsed: Dict[str, Any]) -> Dict[str, Any]:
        # Original rule-based logic
        findings = []
        tables = parsed.get('tables', [])
        for t in tables:
            cols = t.get('columns', [])
            rows = t.get('rows', [])
            for i, col in enumerate(cols[1:], start=1):
                numeric_values = []
                for r in rows:
                    try:
                        numeric_values.append(float(r[i]))
                    except Exception:
                        pass
                if numeric_values:
                    findings.append({
                        'tableId': t.get('tableId'),
                        'column': col,
                        'max': max(numeric_values),
                        'mean': sum(numeric_values)/len(numeric_values),
                    })
        findings.sort(key=lambda f: f['max'], reverse=True)
        return {'findings': findings}


class DataModeler:
    """Proposes visualization types for findings.

    Uses OpenAI LLM if API key is set, otherwise rule-based.
    """

    def run(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        if OPENAI_AVAILABLE and os.getenv('OPENAI_API_KEY'):
            return self._llm_model(analysis)
        else:
            return self._rule_model(analysis)

    def _llm_model(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        client = openai.OpenAI()
        findings = analysis.get('findings', [])
        findings_str = json.dumps(findings, indent=2)
        prompt = f"Based on these findings from document analysis, propose 3D visualization types for each. Options: barChart3D, timeline, network.\n\n{findings_str}\n\nRespond in JSON with 'proposals' as list of dicts with keys: tableId, column, vis."
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300
        )
        content = response.choices[0].message.content
        if content:
            result = json.loads(content)
        else:
            result = {'proposals': []}
        return result

    def _rule_model(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        # Original rule-based logic
        proposals = []
        for f in analysis.get('findings', []):
            col = f.get('column', '').lower()
            if 'year' in col or 'date' in col or 'time' in col:
                vtype = 'timeline'
            else:
                vtype = 'barChart3D'
            proposals.append({'tableId': f['tableId'], 'column': f['column'], 'vis': vtype})
        return {'proposals': proposals}


class CameraDirector:
    """Plans a simple camera path for each scene object."""

    def run(self, proposals: Dict[str, Any]) -> Dict[str, Any]:
        paths = []
        t = 0.0
        for i, p in enumerate(proposals.get('proposals', [])):
            paths.append({'target': p['tableId'], 'from': [0,5,10], 'to': [0,2,5], 'start': t, 'duration': 4.0})
            t += 4.5
        return {'paths': paths}


class AssetBuilder:
    """Selects materials/colors for each visualization.

    Prototype: pick a color scheme and material hints.
    """

    def run(self, proposals: Dict[str, Any]) -> Dict[str, Any]:
        assets = []
        color_presets = ['vivid','cool','warm']
        for i, p in enumerate(proposals.get('proposals', [])):
            assets.append({'tableId': p['tableId'], 'colorScheme': color_presets[i % len(color_presets)], 'material': 'standard'})
        return {'assets': assets}


class Reviewer:
    """Validates scene coherence. For prototype, ensure no duplicate positions or obvious conflicts.
    """

    def run(self, scene: Dict[str, Any]) -> Dict[str, Any]:
        # Very simple checks
        issues = []
        objs = scene.get('objects', [])
        if not objs:
            issues.append('no_objects')
        return {'issues': issues}
