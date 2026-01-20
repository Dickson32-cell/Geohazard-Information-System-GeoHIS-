from sqlalchemy.orm import Session
from app.models import HazardEvent, HazardZone, InfrastructureAsset, SpatialLayer
from app.schemas import HazardEventCreate, HazardZoneCreate, InfrastructureAssetCreate, SpatialLayerCreate

class HazardEventService:
    @staticmethod
    def create_hazard_event(db: Session, hazard_event: HazardEventCreate):
        db_hazard_event = HazardEvent(
            hazard_type=hazard_event.hazard_type,
            geometry=hazard_event.geometry,
            event_date=hazard_event.event_date,
            severity=hazard_event.severity,
            description=hazard_event.description,
            damage_estimate=hazard_event.damage_estimate,
            casualties=hazard_event.casualties,
            data_source=hazard_event.data_source
        )
        db.add(db_hazard_event)
        db.commit()
        db.refresh(db_hazard_event)
        return db_hazard_event

    @staticmethod
    def get_hazard_events(db: Session, skip: int = 0, limit: int = 100):
        return db.query(HazardEvent).offset(skip).limit(limit).all()

class HazardZoneService:
    @staticmethod
    def create_hazard_zone(db: Session, hazard_zone: HazardZoneCreate):
        db_hazard_zone = HazardZone(
            hazard_type=hazard_zone.hazard_type,
            geometry=hazard_zone.geometry,
            risk_level=hazard_zone.risk_level,
            risk_score=hazard_zone.risk_score,
            analysis_parameters=hazard_zone.analysis_parameters
        )
        db.add(db_hazard_zone)
        db.commit()
        db.refresh(db_hazard_zone)
        return db_hazard_zone

    @staticmethod
    def get_hazard_zones(db: Session, skip: int = 0, limit: int = 100):
        return db.query(HazardZone).offset(skip).limit(limit).all()

class InfrastructureAssetService:
    @staticmethod
    def create_infrastructure_asset(db: Session, asset: InfrastructureAssetCreate):
        db_asset = InfrastructureAsset(
            asset_type=asset.asset_type,
            name=asset.name,
            geometry=asset.geometry,
            population_served=asset.population_served,
            vulnerability_score=asset.vulnerability_score
        )
        db.add(db_asset)
        db.commit()
        db.refresh(db_asset)
        return db_asset

    @staticmethod
    def get_infrastructure_assets(db: Session, skip: int = 0, limit: int = 100):
        return db.query(InfrastructureAsset).offset(skip).limit(limit).all()

class SpatialLayerService:
    @staticmethod
    def create_spatial_layer(db: Session, layer: SpatialLayerCreate):
        db_layer = SpatialLayer(
            layer_name=layer.layer_name,
            layer_type=layer.layer_type,
            file_path=layer.file_path,
            layer_metadata=layer.layer_metadata,
            acquisition_date=layer.acquisition_date
        )
        db.add(db_layer)
        db.commit()
        db.refresh(db_layer)
        return db_layer

    @staticmethod
    def get_spatial_layers(db: Session, skip: int = 0, limit: int = 100):
        return db.query(SpatialLayer).offset(skip).limit(limit).all()