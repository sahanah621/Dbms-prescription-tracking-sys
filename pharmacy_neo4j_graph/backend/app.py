"""
============================================================================
DA3: PHARMACY INVENTORY AND PRESCRIPTION TRACKING SYSTEM
MODULE: Backend Application & API Layer (Python Flask)
CONTRIBUTOR: Backend Architecture & API Integration Lead (Member 2)
DOCUMENTATION: See README.md
PURPOSE: Standalone Flask Application Server, 6 Page Routes & 11 REST APIs
============================================================================
"""
import os
import sys
import time
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for, Response

# Path Resolution: backend, frontend, and project root
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, 'frontend')

sys.path.insert(0, BASE_DIR)

from config import Config
from services.neo4j_service import Neo4jService

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

# Flask configured to serve templates and static assets from frontend/
app = Flask(
    __name__,
    template_folder=os.path.join(FRONTEND_DIR, 'templates'),
    static_folder=os.path.join(FRONTEND_DIR, 'static'),
    static_url_path='/static'
)
app.config.from_object(Config)

# Initialize Neo4j Service singleton
neo4j_service = Neo4jService.get_instance()

def success_response(data, message="Operation completed successfully"):
    return jsonify({"success": True, "message": message, "data": data})

def error_response(message, status_code=400):
    return jsonify({"success": False, "message": message, "data": None}), status_code

# Helper to fetch dropdown options directly from Neo4j (live or fallback)
def get_entity_catalog():
    full_graph = neo4j_service.get_full_graph(node_limit=200)
    nodes = full_graph.get('nodes', [])
    
    patients, doctors, pharmacies, medicines, manufacturers, suppliers, hospitals = [], [], [], [], [], [], []
    
    for n in nodes:
        group = n.get('group')
        nid = n.get('id', '')
        props = n.get('properties', {})
        label = n.get('label', '')
        
        # Extract numeric id
        raw_id = nid.split('_')[-1] if '_' in nid else nid
        try:
            num_id = int(raw_id)
        except ValueError:
            num_id = raw_id

        if group == 'Patient':
            name_parts = label.split(' ')
            fn = name_parts[0] if name_parts else 'Patient'
            ln = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            patients.append({
                'Patient_ID': num_id,
                'First_Name': props.get('name', fn).split(' ')[0],
                'Last_Name': ' '.join(props.get('name', fn).split(' ')[1:]) if ' ' in props.get('name', fn) else ln,
                'City': props.get('city', 'Mumbai')
            })
        elif group == 'Doctor':
            name_parts = label.split(' ')
            fn = name_parts[0] if name_parts else 'Dr'
            ln = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
            doctors.append({
                'Doctor_ID': num_id,
                'First_Name': fn,
                'Last_Name': ln,
                'Qualification': props.get('specialization', 'MBBS, MD')
            })
        elif group == 'Pharmacy':
            pharmacies.append({
                'Pharmacy_ID': num_id,
                'Name': props.get('name', label),
                'City': props.get('city', 'Mumbai')
            })
        elif group == 'Medicine':
            medicines.append({
                'Medicine_ID': num_id,
                'Name': props.get('name', label),
                'Price': float(props.get('price', 50.0))
            })
        elif group == 'Manufacturer':
            manufacturers.append({
                'Manufacturer_ID': num_id,
                'Brand_Name': props.get('name', props.get('brand_name', label))
            })
        elif group == 'Supplier':
            suppliers.append({
                'Supplier_ID': num_id,
                'Name': props.get('name', label)
            })
        elif group == 'Hospital':
            hospitals.append({
                'Hospital_ID': num_id,
                'Name': props.get('name', label),
                'City': props.get('city', 'Mumbai')
            })

    return {
        'patients': patients,
        'doctors': doctors,
        'pharmacies': pharmacies,
        'medicines': medicines,
        'manufacturers': manufacturers,
        'suppliers': suppliers,
        'hospitals': hospitals
    }

# ============================================================================
# WEB PAGE ROUTES
# ============================================================================

@app.route('/')
def index():
    return redirect(url_for('graph_intelligence_view'))

@app.route('/graph')
@app.route('/graph-intelligence')
def graph_intelligence_view():
    stats = neo4j_service.get_graph_statistics()
    catalog = get_entity_catalog()
    return render_template(
        'graph_intelligence.html',
        stats=stats,
        manufacturers=catalog['manufacturers'],
        suppliers=catalog['suppliers'],
        active_page='graph_intelligence'
    )

@app.route('/graph-explorer')
def graph_explorer_view():
    catalog = get_entity_catalog()
    return render_template(
        'graph_explorer.html',
        patients=catalog['patients'],
        medicines=catalog['medicines'],
        pharmacies=catalog['pharmacies'],
        doctors=catalog['doctors'],
        active_page='graph_explorer'
    )

@app.route('/path-finder')
def path_finder_view():
    catalog = get_entity_catalog()
    return render_template(
        'path_finder.html',
        patients=catalog['patients'],
        doctors=catalog['doctors'],
        pharmacies=catalog['pharmacies'],
        medicines=catalog['medicines'],
        manufacturers=catalog['manufacturers'],
        suppliers=catalog['suppliers'],
        hospitals=catalog['hospitals'],
        active_page='path_finder'
    )

@app.route('/supply-chain')
def supply_chain_view():
    catalog = get_entity_catalog()
    return render_template(
        'supply_chain.html',
        medicines=catalog['medicines'],
        active_page='supply_chain'
    )

@app.route('/cypher-playground')
def cypher_playground_view():
    predefined = neo4j_service.get_predefined_queries()
    return render_template(
        'cypher_playground.html',
        predefined=predefined,
        active_page='cypher_playground'
    )

@app.route('/mysql-vs-neo4j')
@app.route('/comparison')
def comparison_view():
    catalog = get_entity_catalog()
    return render_template(
        'comparison.html',
        medicines=catalog['medicines'],
        patients=catalog['patients'],
        suppliers=catalog['suppliers'],
        active_page='comparison'
    )

# ============================================================================
# NEO4J REST API ENDPOINTS
# ============================================================================

@app.route('/api/neo4j/status', methods=['GET'])
def api_status():
    return success_response(neo4j_service.get_status())

@app.route('/api/neo4j/graph', methods=['GET'])
def api_graph():
    limit = int(request.args.get('limit', 150))
    return success_response(neo4j_service.get_full_graph(limit))

@app.route('/api/neo4j/stats', methods=['GET'])
def api_stats():
    return success_response(neo4j_service.get_graph_statistics())

@app.route('/api/neo4j/explore', methods=['POST'])
def api_explore():
    data = request.json or {}
    label = data.get('label', 'Patient')
    entity_id = data.get('entity_id')
    depth = int(data.get('depth', 1))
    if not entity_id:
        return error_response("Entity ID is required.", status_code=400)
    res = neo4j_service.get_entity_neighborhood(label, entity_id, depth)
    return success_response(res)

@app.route('/api/neo4j/path', methods=['POST'])
def api_path():
    data = request.json or {}
    from_type = data.get('from_type')
    from_id = data.get('from_id')
    to_type = data.get('to_type')
    to_id = data.get('to_id')
    if not from_type or not from_id or not to_type or not to_id:
        return error_response("Both FROM and TO entities are required.", status_code=400)
    res = neo4j_service.find_shortest_path(from_type, from_id, to_type, to_id)
    return success_response(res)

@app.route('/api/neo4j/supply-chain', methods=['GET'])
def api_supply_chain():
    medicine_id = request.args.get('medicine_id', 501)
    res = neo4j_service.get_supply_chain_flow(medicine_id)
    return success_response(res)

@app.route('/api/neo4j/cypher', methods=['POST'])
def api_cypher():
    data = request.json or {}
    query = data.get('query', '')
    if not query.strip():
        return error_response("Cypher query cannot be empty.", status_code=400)
    res = neo4j_service.execute_cypher(query)
    if res.get('success'):
        return success_response(res)
    return error_response(res.get('error', 'Cypher execution failed'), status_code=400)

@app.route('/api/neo4j/simulation/disruption', methods=['GET'])
def api_simulation_disruption():
    node_type = request.args.get('type', 'Manufacturer')
    node_id = request.args.get('id', 701)
    res = neo4j_service.simulate_supply_disruption(node_type, int(node_id))
    return success_response(res)

@app.route('/api/neo4j/anomalies', methods=['GET'])
def api_anomalies():
    res = neo4j_service.detect_prescription_anomalies()
    return success_response(res)

@app.route('/api/neo4j/centrality', methods=['GET'])
def api_centrality():
    res = neo4j_service.calculate_centrality_metrics()
    return success_response(res)

@app.route('/api/neo4j/export/cypher', methods=['GET'])
def api_export_cypher():
    cypher_text = neo4j_service.generate_cypher_export()
    return Response(
        cypher_text,
        mimetype='text/plain',
        headers={'Content-Disposition': 'attachment; filename=pharmacy_graph_neo4j.cypher'}
    )

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5051))
    print(f"[*] Starting PHARMA Neo4j Graph Intelligence Server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
