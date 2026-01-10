"""create initial tables

Revision ID: 001
Revises:
Create Date: 2024-12-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create hazard_events table
    op.create_table('hazard_events',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('hazard_type', sa.Enum('flood', 'landslide', 'erosion', name='hazardtype'), nullable=False),
        sa.Column('geometry', Geometry(geometry_type='GEOMETRY', srid=4326), nullable=False),
        sa.Column('event_date', sa.DateTime(), nullable=False),
        sa.Column('severity', sa.Enum('low', 'medium', 'high', 'extreme', name='severity'), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('damage_estimate', sa.Float(), nullable=True),
        sa.Column('casualties', sa.Integer(), nullable=True),
        sa.Column('data_source', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create hazard_zones table
    op.create_table('hazard_zones',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('hazard_type', sa.Enum('flood', 'landslide', 'erosion', name='hazardtype'), nullable=False),
        sa.Column('geometry', Geometry(geometry_type='POLYGON', srid=4326), nullable=False),
        sa.Column('risk_level', sa.Enum('very_low', 'low', 'moderate', 'high', 'very_high', name='risklevel'), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('analysis_date', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.Column('analysis_parameters', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create infrastructure_assets table
    op.create_table('infrastructure_assets',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('asset_type', sa.Enum('school', 'hospital', 'road', 'bridge', 'building', name='assettype'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('geometry', Geometry(geometry_type='GEOMETRY', srid=4326), nullable=False),
        sa.Column('population_served', sa.Integer(), nullable=True),
        sa.Column('vulnerability_score', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Create spatial_layers table
    op.create_table('spatial_layers',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('layer_name', sa.String(), nullable=False),
        sa.Column('layer_type', sa.Enum('dem', 'slope', 'drainage', 'landuse', 'soil', 'geology', name='layertype'), nullable=False),
        sa.Column('file_path', sa.String(), nullable=False),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('acquisition_date', sa.Date(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('spatial_layers')
    op.drop_table('infrastructure_assets')
    op.drop_table('hazard_zones')
    op.drop_table('hazard_events')