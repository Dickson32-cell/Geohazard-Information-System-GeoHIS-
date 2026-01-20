#!/usr/bin/env python3
"""
GeoHIS Enhancement Installation Script

This script installs all new analysis modules, frontend components, and notebooks
into the GeoHIS codebase.

Usage:
    python install_enhancements.py /path/to/GeoHIS

Author: GeoHIS Research Team
Date: January 2026
"""

import os
import shutil
import sys
from pathlib import Path

def install_enhancements(geohis_path: str):
    """Install all enhancements to the GeoHIS codebase."""
    
    geohis_path = Path(geohis_path)
    
    if not geohis_path.exists():
        print(f"❌ Error: GeoHIS path not found: {geohis_path}")
        return False
    
    # Define source files (in same directory as this script)
    script_dir = Path(__file__).parent
    
    # Define installation targets
    installations = [
        # Statistical Models
        {
            'source': 'shannon_entropy.py',
            'target': geohis_path / 'backend/app/analysis/statistical_models/shannon_entropy.py',
            'description': "Shannon's Entropy module"
        },
        {
            'source': 'evidential_belief.py',
            'target': geohis_path / 'backend/app/analysis/statistical_models/evidential_belief.py',
            'description': 'Evidential Belief Function module'
        },
        {
            'source': 'spatial_cv.py',
            'target': geohis_path / 'backend/app/analysis/comparison/spatial_cv.py',
            'description': 'Spatial Cross-Validation module'
        },
        # Frontend Components
        {
            'source': 'frontend/AnalysisMethodSelector.jsx',
            'target': geohis_path / 'frontend/src/components/analysis/AnalysisMethodSelector.jsx',
            'description': 'Analysis Method Selector component'
        },
        {
            'source': 'frontend/ModelComparisonDashboard.jsx',
            'target': geohis_path / 'frontend/src/components/analysis/ModelComparisonDashboard.jsx',
            'description': 'Model Comparison Dashboard component'
        },
        # Notebooks
        {
            'source': 'notebooks/GeoHIS_Complete_Analysis_Tutorial.ipynb',
            'target': geohis_path / 'notebooks/GeoHIS_Complete_Analysis_Tutorial.ipynb',
            'description': 'Complete Analysis Tutorial notebook'
        },
    ]
    
    print("=" * 60)
    print("GeoHIS Enhancement Installation")
    print("=" * 60)
    print(f"\nTarget directory: {geohis_path}\n")
    
    installed = 0
    failed = 0
    
    for item in installations:
        source = script_dir / item['source']
        target = Path(item['target'])
        
        print(f"Installing: {item['description']}")
        print(f"  Source: {source}")
        print(f"  Target: {target}")
        
        try:
            # Create target directory if needed
            target.parent.mkdir(parents=True, exist_ok=True)
            
            if source.exists():
                shutil.copy2(source, target)
                print(f"  ✅ Installed successfully\n")
                installed += 1
            else:
                print(f"  ⚠️ Source file not found, skipping\n")
                failed += 1
        except Exception as e:
            print(f"  ❌ Failed: {e}\n")
            failed += 1
    
    # Update __init__.py files
    print("\nUpdating module imports...")
    
    # Update statistical_models __init__.py
    init_file = geohis_path / 'backend/app/analysis/statistical_models/__init__.py'
    if init_file.exists():
        content = init_file.read_text()
        
        new_imports = '''
# Additional statistical models
from .shannon_entropy import ShannonEntropyAnalyzer, classify_entropy_susceptibility
from .evidential_belief import EvidentialBeliefAnalyzer, classify_ebf_susceptibility
'''
        
        if 'shannon_entropy' not in content:
            with open(init_file, 'a') as f:
                f.write(new_imports)
            print("  ✅ Updated statistical_models/__init__.py")
    
    # Update comparison __init__.py
    init_file = geohis_path / 'backend/app/analysis/comparison/__init__.py'
    if init_file.exists():
        content = init_file.read_text()
        
        new_imports = '''
# Spatial Cross-Validation
from .spatial_cv import (
    SpatialBlockCV,
    SpatialBufferCV,
    SpatialClusterCV,
    spatial_cross_validate,
    compare_cv_methods
)
'''
        
        if 'spatial_cv' not in content:
            with open(init_file, 'a') as f:
                f.write(new_imports)
            print("  ✅ Updated comparison/__init__.py")
    
    print("\n" + "=" * 60)
    print("Installation Summary")
    print("=" * 60)
    print(f"  Installed: {installed}")
    print(f"  Failed: {failed}")
    print(f"  Total: {len(installations)}")
    
    if failed == 0:
        print("\n✅ All enhancements installed successfully!")
    else:
        print(f"\n⚠️ {failed} installation(s) failed. Check the output above.")
    
    return failed == 0


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python install_enhancements.py /path/to/GeoHIS")
        print("\nExample:")
        print('  python install_enhancements.py "E:\\path\\to\\Geohazard-Information-System-GeoHIS--main"')
        sys.exit(1)
    
    geohis_path = sys.argv[1]
    success = install_enhancements(geohis_path)
    sys.exit(0 if success else 1)