"""Seed script to populate the database with sample data."""
from app.database import SessionLocal, engine, Base
from app.models.models import User, Port, DDFLog, OFCRoute
from app.auth import get_password_hash

# Create all tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # Create admin user
    admin = db.query(User).filter(User.username == "admin").first()
    if not admin:
        admin = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin)

    # Create regular user
    user = db.query(User).filter(User.username == "operator").first()
    if not user:
        user = User(
            username="operator",
            password_hash=get_password_hash("operator123"),
            role="user"
        )
        db.add(user)

    db.commit()

    # Sample Ports
    sample_ports = [
        Port(equipment_name="OLT-BSNL-MH-01", equipment_ip="10.10.1.1", equipment_type="OLT",
             port_number="GE-0/0/1", port_type="GPON", fibre_tag="FT-MH-001",
             ddf_name="DDF-A1", ddf_port="P01", status="active", remarks="Main uplink"),
        Port(equipment_name="OLT-BSNL-MH-01", equipment_ip="10.10.1.1", equipment_type="OLT",
             port_number="GE-0/0/2", port_type="GPON", fibre_tag="FT-MH-002",
             ddf_name="DDF-A1", ddf_port="P02", status="active", remarks="Secondary uplink"),
        Port(equipment_name="Switch-Core-01", equipment_ip="10.10.2.1", equipment_type="L3 Switch",
             port_number="Eth-1/1", port_type="Ethernet", fibre_tag="FT-MH-003",
             ddf_name="DDF-B1", ddf_port="P01", status="active", remarks="Core switch port"),
        Port(equipment_name="Router-Edge-01", equipment_ip="10.10.3.1", equipment_type="Router",
             port_number="GE-0/1/0", port_type="GigE", fibre_tag="FT-MH-004",
             ddf_name="DDF-B1", ddf_port="P02", status="inactive", remarks="Maintenance"),
        Port(equipment_name="OLT-BSNL-DL-01", equipment_ip="10.20.1.1", equipment_type="OLT",
             port_number="GE-0/0/1", port_type="GPON", fibre_tag="FT-DL-001",
             ddf_name="DDF-C1", ddf_port="P01", status="active", remarks="Delhi sector"),
        Port(equipment_name="DWDM-MUX-01", equipment_ip="10.10.4.1", equipment_type="DWDM",
             port_number="CH-01", port_type="Optical", fibre_tag="FT-MH-005",
             ddf_name="DDF-A2", ddf_port="P01", status="active", remarks="DWDM channel 1"),
        Port(equipment_name="OLT-BSNL-KA-01", equipment_ip="10.30.1.1", equipment_type="OLT",
             port_number="GE-0/0/1", port_type="GPON", fibre_tag="FT-KA-001",
             ddf_name="DDF-D1", ddf_port="P01", status="faulty", remarks="SFP issue reported"),
        Port(equipment_name="Switch-Agg-01", equipment_ip="10.10.5.1", equipment_type="L2 Switch",
             port_number="FE-0/1", port_type="FastEthernet", fibre_tag="FT-MH-006",
             ddf_name="DDF-A1", ddf_port="P03", status="active", remarks="Aggregation switch"),
    ]

    # Sample DDF Records
    sample_ddf = [
        DDFLog(ddf_name="DDF-A1", ddf_port="P01", connected_to="OLT-BSNL-MH-01:GE-0/0/1",
               connection_type="SC/APC", status="active", remarks="Main frame row A"),
        DDFLog(ddf_name="DDF-A1", ddf_port="P02", connected_to="OLT-BSNL-MH-01:GE-0/0/2",
               connection_type="SC/APC", status="active", remarks="Main frame row A"),
        DDFLog(ddf_name="DDF-A1", ddf_port="P03", connected_to="Switch-Agg-01:FE-0/1",
               connection_type="LC/UPC", status="active", remarks="Main frame row A"),
        DDFLog(ddf_name="DDF-B1", ddf_port="P01", connected_to="Switch-Core-01:Eth-1/1",
               connection_type="LC/UPC", status="active", remarks="Core distribution"),
        DDFLog(ddf_name="DDF-B1", ddf_port="P02", connected_to="Router-Edge-01:GE-0/1/0",
               connection_type="SC/APC", status="inactive", remarks="Under maintenance"),
        DDFLog(ddf_name="DDF-C1", ddf_port="P01", connected_to="OLT-BSNL-DL-01:GE-0/0/1",
               connection_type="SC/APC", status="active", remarks="Delhi exchange"),
        DDFLog(ddf_name="DDF-A2", ddf_port="P01", connected_to="DWDM-MUX-01:CH-01",
               connection_type="LC/APC", status="active", remarks="DWDM frame"),
        DDFLog(ddf_name="DDF-D1", ddf_port="P01", connected_to="OLT-BSNL-KA-01:GE-0/0/1",
               connection_type="SC/APC", status="faulty", remarks="Connector damaged"),
    ]

    # Sample OFC Routes
    sample_ofc = [
        OFCRoute(route_name="MH-DL-BACKBONE", start_location="Mumbai CTO", end_location="Delhi CTO",
                 route_length=1420.5, fiber_count=96, core_utilization=72,
                 status="active", remarks="Main backbone route"),
        OFCRoute(route_name="MH-PU-LINK", start_location="Mumbai CTO", end_location="Pune Exchange",
                 route_length=165.8, fiber_count=48, core_utilization=38,
                 status="active", remarks="Metro link"),
        OFCRoute(route_name="DL-JA-ROUTE", start_location="Delhi CTO", end_location="Jaipur Exchange",
                 route_length=280.3, fiber_count=48, core_utilization=25,
                 status="active", remarks="Northern ring"),
        OFCRoute(route_name="MH-KA-BACKBONE", start_location="Mumbai CTO", end_location="Bangalore CTO",
                 route_length=980.2, fiber_count=96, core_utilization=85,
                 status="active", remarks="Southern backbone"),
        OFCRoute(route_name="KA-TN-LINK", start_location="Bangalore CTO", end_location="Chennai CTO",
                 route_length=345.6, fiber_count=48, core_utilization=42,
                 status="active", remarks="South-east link"),
        OFCRoute(route_name="DL-UP-METRO", start_location="Delhi CTO", end_location="Noida Exchange",
                 route_length=35.2, fiber_count=24, core_utilization=20,
                 status="active", remarks="Metro ring"),
        OFCRoute(route_name="MH-GJ-ROUTE", start_location="Mumbai CTO", end_location="Ahmedabad CTO",
                 route_length=525.0, fiber_count=48, core_utilization=30,
                 status="under_maintenance", remarks="Cable replacement in progress"),
        OFCRoute(route_name="KL-TN-LINK", start_location="Kochi Exchange", end_location="Chennai CTO",
                 route_length=690.4, fiber_count=24, core_utilization=18,
                 status="active", remarks="Kerala-TN corridor"),
    ]

    for port in sample_ports:
        db.add(port)
    for ddf in sample_ddf:
        db.add(ddf)
    for ofc in sample_ofc:
        db.add(ofc)

    db.commit()
    print("✓ Database seeded successfully!")
    print(f"  - Users: 2 (admin/admin123, operator/operator123)")
    print(f"  - Ports: {len(sample_ports)}")
    print(f"  - DDF Records: {len(sample_ddf)}")
    print(f"  - OFC Routes: {len(sample_ofc)}")

except Exception as e:
    print(f"Error seeding database: {e}")
    db.rollback()
finally:
    db.close()
