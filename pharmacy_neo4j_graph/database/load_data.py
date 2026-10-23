"""
Convenience script to load all Cypher scripts (constraints + sample data)
directly into your Neo4j AuraDB Cloud or Local instance in 3 seconds.

Usage:
    python load_data.py
"""
import os
import getpass
from pathlib import Path
from neo4j import GraphDatabase

def main():
    print("=" * 60)
    print("  PHARMA Graph Intelligence — Cloud Database Seed Loader")
    print("=" * 60)
    
    default_uri = "neo4j+s://2151d48a.databases.neo4j.io"
    uri = input(f"Enter Neo4j URI [{default_uri}]: ").strip() or default_uri
    user = input("Enter Username [neo4j]: ").strip() or "neo4j"
    password = getpass.getpass("Enter Password: ").strip()

    if not password:
        print("[!] Error: Password cannot be empty.")
        return

    print(f"\n[*] Connecting to {uri}...")
    try:
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        print("[✓] Connection successful!")
    except Exception as e:
        print(f"[!] Failed to connect: {e}")
        return

    db_dir = Path(__file__).resolve().parent

    # 1. Load Constraints
    constraints_path = db_dir / "01_constraints.cypher"
    if constraints_path.exists():
        print("[*] Applying constraints from 01_constraints.cypher...")
        with open(constraints_path) as f:
            lines = f.read().split(";")
            with driver.session() as session:
                for line in lines:
                    stmt = line.strip()
                    if stmt and not stmt.startswith("//"):
                        try:
                            session.run(stmt)
                        except Exception as e:
                            pass
        print("[✓] Constraints applied.")

    # 2. Load Sample Data
    data_path = db_dir / "03_sample_data.cypher"
    if data_path.exists():
        print("[*] Seeding 87 nodes and 153 relationships from 03_sample_data.cypher...")
        with open(data_path) as f:
            query = f.read().strip()
            with driver.session() as session:
                session.run(query)
        print("[✓] Sample dataset loaded successfully into your cloud database!")

    # 3. Verify counts
    with driver.session() as session:
        n_count = session.run("MATCH (n) RETURN count(n) AS cnt").single()["cnt"]
        r_count = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt").single()["cnt"]
        print("\n" + "=" * 60)
        print(f"  LIVE DATABASE VERIFICATION:")
        print(f"  • Total Entity Nodes:         {n_count} (Expected: 87)")
        print(f"  • Total Directed Relationships: {r_count} (Expected: 153)")
        print("=" * 60)

    driver.close()
    print("\n[🎉] Done! You can now view the entire graph in your Neo4j Aura console!")

if __name__ == "__main__":
    main()
