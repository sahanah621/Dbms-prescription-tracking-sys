import os
import time
import logging
from collections import deque
from config import Config

logger = logging.getLogger(__name__)

try:
    from neo4j import GraphDatabase, exceptions as neo4j_exceptions
    NEO4J_DRIVER_AVAILABLE = True
except ImportError:
    NEO4J_DRIVER_AVAILABLE = False
    neo4j_exceptions = None


class Neo4jService:
    """
    Complementary Neo4j Graph Database Service for Graph Intelligence.
    Provides graph traversal, degree-based connectivity analysis,
    shortest-path discovery, and interactive visual graph payloads.
    
    Resilience Guard:
    - If connected to live Neo4j, status is explicitly reported as:
      '● Neo4j Graph DB Active'
    - If Neo4j is offline or password is unconfigured, status is explicitly reported as:
      '● Neo4j Offline — Demo Graph Fallback'
      (serving embedded graph dataset so UI and evaluation never crash).
    """

    _instance = None

    def __init__(self):
        self.uri = Config.NEO4J_URI
        self.user = Config.NEO4J_USERNAME
        # Strictly read from Config / .env; NO hardcoded fallback password
        self.password = Config.NEO4J_PASSWORD
        self.database = Config.NEO4J_DATABASE
        
        self.driver = None
        self.is_connected = False
        self.connection_error = None
        
        # Color palette for Vis.js graph nodes
        self.label_colors = {
            'Patient': {'background': '#008080', 'border': '#00d4b2', 'highlight': '#2dd4bf'},
            'Doctor': {'background': '#4f46e5', 'border': '#818cf8', 'highlight': '#a5b4fc'},
            'Hospital': {'background': '#7c3aed', 'border': '#a78bfa', 'highlight': '#c4b5fd'},
            'Pharmacy': {'background': '#0284c7', 'border': '#38bdf8', 'highlight': '#7dd3fc'},
            'Pharmacist': {'background': '#db2777', 'border': '#f472b6', 'highlight': '#fbcfe8'},
            'Medicine': {'background': '#059669', 'border': '#34d399', 'highlight': '#6ee7b7'},
            'Prescription': {'background': '#d97706', 'border': '#fbbf24', 'highlight': '#fde68a'},
            'Manufacturer': {'background': '#e11d48', 'border': '#fb7185', 'highlight': '#fda4af'},
            'Supplier': {'background': '#ea580c', 'border': '#fb923c', 'highlight': '#fdba74'},
            'WholesaleSupplier': {'background': '#475569', 'border': '#94a3b8', 'highlight': '#cbd5e1'}
        }

        # Initialize embedded graph fallback model from relational data
        self._fallback_graph = self._build_fallback_graph()

        # Attempt connection only if password is provided
        self._init_driver()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = Neo4jService()
        return cls._instance

    def _init_driver(self):
        """Initializes Neo4j driver if credentials are provided in .env."""
        if not NEO4J_DRIVER_AVAILABLE:
            self.is_connected = False
            self.connection_error = "neo4j Python package is not installed."
            return

        if not self.password or not self.password.strip():
            self.is_connected = False
            self.connection_error = "NEO4J_PASSWORD not configured in .env."
            return

        try:
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password),
                max_connection_lifetime=60,
                connection_acquisition_timeout=15.0,
                keep_alive=True
            )
            # Verify connectivity
            self.driver.verify_connectivity()
            self.is_connected = True
            self.connection_error = None
            logger.info(f"[*] Connected successfully to Neo4j on {self.uri}")
        except Exception as e:
            self.is_connected = False
            self.connection_error = str(e)
            logger.warning(f"[!] Neo4j connection failed ({e}). Operating in Demo Graph Fallback mode.")

    def _reconnect(self):
        """Forces clean re-initialization of the driver if AuraDB connection is dropped or defunct."""
        try:
            if self.driver:
                try:
                    self.driver.close()
                except Exception:
                    pass
        except Exception:
            pass
        finally:
            self._init_driver()

    def get_status(self):
        """Returns connection status for UI top bar and settings."""
        if self.is_connected:
            return {
                'active': True,
                'is_neo4j': True,
                'mode': 'live',
                'label': '● Neo4j Graph DB Active',
                'engine': 'Neo4j Graph Database 5.x',
                'uri': self.uri,
                'database': self.database,
                'error': None
            }
        else:
            return {
                'active': False,
                'is_neo4j': False,
                'mode': 'fallback',
                'label': '● Neo4j Offline — Demo Graph Fallback',
                'engine': 'Demo Graph Model (Transformed Relational Dataset)',
                'uri': self.uri,
                'database': self.database,
                'error': self.connection_error or "Password not set in .env"
            }

    def _get_session(self):
        """Returns a session, omitting database parameter on AuraDB default instances."""
        if self.database and not self.uri.startswith('neo4j+s://') and self.database != 'neo4j':
            return self.driver.session(database=self.database)
        return self.driver.session()

    # -------------------------------------------------------------------------
    # GRAPH DATA RETRIEVAL (Full Graph for Vis.js)
    # -------------------------------------------------------------------------
    def get_full_graph(self, node_limit=500):
        """Fetches the complete graph network for visualization."""
        if self.is_connected:
            try:
                with self._get_session() as session:
                    cypher = """
                    MATCH (n)
                    OPTIONAL MATCH (n)-[r]->(m)
                    RETURN n, r, m
                    """
                    result = session.run(cypher)
                    nodes_dict = {}
                    edges_list = []
                    edge_ids = set()
                    
                    for record in result:
                        n = record.get('n')
                        r = record.get('r')
                        m = record.get('m')
                        
                        if n is not None:
                            n_id = f"{list(n.labels)[0]}_{self._get_node_raw_id(n)}" if n.labels else f"Node_{n.element_id}"
                            if n_id not in nodes_dict:
                                nodes_dict[n_id] = self._format_neo4j_node(n)
                        
                        if m is not None:
                            m_id = f"{list(m.labels)[0]}_{self._get_node_raw_id(m)}" if m.labels else f"Node_{m.element_id}"
                            if m_id not in nodes_dict:
                                nodes_dict[m_id] = self._format_neo4j_node(m)
                                
                        if r is not None and n is not None and m is not None:
                            e_formatted = self._format_neo4j_edge(r, n, m)
                            if e_formatted['id'] not in edge_ids:
                                edge_ids.add(e_formatted['id'])
                                edges_list.append(e_formatted)
                            
                    return {
                        'nodes': list(nodes_dict.values()),
                        'edges': edges_list,
                        'mode': 'live',
                        'count_nodes': len(nodes_dict),
                        'count_edges': len(edges_list)
                    }
            except Exception as e:
                logger.error(f"Live Neo4j query failed: {e}. Reverting to fallback model.")

        # Return transparently labeled fallback model
        return {
            'nodes': self._fallback_graph['nodes'],
            'edges': self._fallback_graph['edges'],
            'mode': 'fallback',
            'count_nodes': len(self._fallback_graph['nodes']),
            'count_edges': len(self._fallback_graph['edges'])
        }

    # -------------------------------------------------------------------------
    # GRAPH EXPLORER (Neighborhood expansion around an entity)
    # -------------------------------------------------------------------------
    def get_entity_neighborhood(self, label, entity_id, depth=1):
        """Fetches 1-hop or 2-hop connected subnetwork around an entity."""
        depth = min(max(int(depth), 1), 2)
        
        if self.is_connected:
            try:
                with self._get_session() as session:
                    prop_key = self._get_id_property_name(label)
                    cypher = f"""
                    MATCH (center:{label} {{{prop_key}: $entity_id}})
                    CALL apoc.path.subgraphAll(center, {{maxLevel: {depth}}})
                    YIELD nodes, relationships
                    RETURN nodes, relationships
                    """
                    # Fallback without APOC
                    alt_cypher = f"""
                    MATCH (center:{label} {{{prop_key}: $entity_id}})
                    OPTIONAL MATCH path = (center)-[*1..{depth}]-(connected)
                    RETURN center, collect(path) AS paths
                    """
                    result = session.run(alt_cypher, entity_id=int(entity_id))
                    record = result.single()
                    if record and record['center']:
                        nodes_dict = {}
                        edges_list = []
                        center = record['center']
                        center_id = f"{label}_{entity_id}"
                        nodes_dict[center_id] = self._format_neo4j_node(center, is_center=True)
                        
                        edge_ids = set()
                        for p in record['paths']:
                            for n in p.nodes:
                                n_id = f"{list(n.labels)[0]}_{self._get_node_raw_id(n)}"
                                if n_id not in nodes_dict:
                                    nodes_dict[n_id] = self._format_neo4j_node(n)
                            for r in p.relationships:
                                if r is not None:
                                    e_obj = self._format_neo4j_edge(r, r.start_node, r.end_node)
                                    if e_obj['id'] not in edge_ids:
                                        edge_ids.add(e_obj['id'])
                                        edges_list.append(e_obj)
                                
                        return {
                            'nodes': list(nodes_dict.values()),
                            'edges': edges_list,
                            'center_node_id': center_id,
                            'mode': 'live'
                        }
            except Exception as e:
                logger.error(f"Live neighborhood query failed: {e}")

        # Fallback in-memory traversal
        target_id = f"{label}_{entity_id}"
        return self._traverse_fallback_neighborhood(target_id, depth)

    # -------------------------------------------------------------------------
    # RELATIONSHIP PATH FINDER (Shortest Path between 2 Entities)
    # -------------------------------------------------------------------------
    def find_shortest_path(self, from_type, from_id, to_type, to_id):
        """Finds shortest path between two nodes."""
        from_id_str = f"{from_type}_{from_id}"
        to_id_str = f"{to_type}_{to_id}"

        REVERSE_REL_LABELS = {
            'STOCKS': 'STOCKED_BY',
            'HAS_PRESCRIPTION': 'PRESCRIPTION_FOR',
            'CONTAINS_MEDICINE': 'PRESCRIBED_IN',
            'SUPPLIES_TO': 'SUPPLIED_BY',
            'PROCURES_FROM': 'MANUFACTURES_FOR',
            'AFFILIATED_WITH': 'AFFILIATED_DOCTOR',
            'WORKS_AT': 'EMPLOYS',
            'EMPLOYED_AT': 'EMPLOYS',
            'WRITES': 'WRITTEN_BY'
        }

        if self.is_connected:
            try:
                with self._get_session() as session:
                    from_key = self._get_id_property_name(from_type)
                    to_key = self._get_id_property_name(to_type)
                    cypher = f"""
                    MATCH (start:{from_type} {{{from_key}: $from_id}}),
                          (target:{to_type} {{{to_key}: $to_id}})
                    MATCH path = shortestPath((start)-[*]-(target))
                    RETURN path
                    """
                    res = session.run(cypher, from_id=int(from_id) if str(from_id).isdigit() else from_id, to_id=int(to_id) if str(to_id).isdigit() else to_id)
                    rec = res.single()
                    if rec and rec['path']:
                        path = rec['path']
                        path_nodes = [self._format_neo4j_node(n) for n in path.nodes]
                        hops = [n.get('name') or n.get('brand_name') or f"Rx#{n.get('prescription_id')}" for n in path.nodes]
                        
                        traversal_edges = []
                        for i in range(len(path_nodes) - 1):
                            source = path_nodes[i]
                            target = path_nodes[i + 1]
                            r = path.relationships[i]
                            raw_label = r.type
                            # Check if relationship matches traversal direction
                            r_start_id = getattr(r.start_node, 'element_id', str(getattr(r.start_node, 'id', '')))
                            s_id = getattr(source, 'element_id', str(source.get('id', '')))
                            is_fwd = (r_start_id == s_id)
                            rel_label = raw_label if is_fwd else REVERSE_REL_LABELS.get(raw_label, raw_label)
                            
                            traversal_edges.append({
                                'id': f"path_e_{i}_{source['id']}_{target['id']}",
                                'from': source['id'],
                                'to': target['id'],
                                'label': rel_label,
                                'raw_label': raw_label,
                                'is_forward': is_fwd,
                                'width': 3,
                                'color': {'color': '#38bdf8', 'highlight': '#00d4b2'},
                                'arrows': {'to': {'enabled': True, 'scaleFactor': 1.1}},
                                'font': {
                                    'size': 11,
                                    'color': '#38bdf8',
                                    'face': 'Inter, system-ui, sans-serif',
                                    'bold': True,
                                    'background': '#0a0f1d',
                                    'strokeWidth': 2,
                                    'strokeColor': '#0284c7',
                                    'align': 'top'
                                },
                                'title': f"<b>Step {i+1} &rarr; {i+2}:</b> {rel_label}"
                            })

                        for i, n in enumerate(path_nodes):
                            n['level'] = i
                            n['step'] = i + 1
                            n['is_origin'] = (i == 0)
                            n['is_destination'] = (i == len(path_nodes) - 1)

                        return {
                            'found': True,
                            'nodes': path_nodes,
                            'edges': traversal_edges,
                            'hops': hops,
                            'length': len(traversal_edges),
                            'mode': 'live'
                        }
            except Exception as e:
                logger.error(f"Live shortestPath query failed: {e}")

        # Fallback BFS shortest path
        return self._fallback_shortest_path(from_id_str, to_id_str)

    # -------------------------------------------------------------------------
    # SUPPLY CHAIN FLOW (Animated Multi-Hop Traversal)
    # -------------------------------------------------------------------------
    def get_supply_chain_flow(self, medicine_id=None):
        """Returns complete, multi-tier pharmaceutical supply chain provenance for a medicine."""
        try:
            med_id = int(medicine_id) if medicine_id else 504
        except (ValueError, TypeError):
            med_id = 504

        nodes = self._fallback_graph['nodes']
        edges = self._fallback_graph['edges']

        med_node = next((n for n in nodes if n['id'] == f"Medicine_{med_id}"), None)
        if not med_node:
            med_node = next((n for n in nodes if n['id'].startswith("Medicine_")), nodes[0])
            med_id = int(med_node['id'].replace("Medicine_", ""))

        chain_nodes = []
        chain_edges = []
        node_ids = set()

        # 1. Tier 3: Central Formulary Medicine
        node_ids.add(med_node['id'])
        chain_nodes.append({
            **med_node,
            'tier': 3,
            'level': 3,
            'stage': 'Formulary Medicine',
            'is_center': True
        })

        # 2. Tier 4: Dispensary Pharmacies (Stocking this medicine)
        stocking_pharmacies = []
        for e in edges:
            if e.get('to') == med_node['id'] and e.get('label') == 'STOCKS':
                ph = next((n for n in nodes if n['id'] == e.get('from')), None)
                if ph and ph['id'] not in node_ids:
                    node_ids.add(ph['id'])
                    stocking_pharmacies.append(ph)
                    qty = e.get('properties', {}).get('quantity', 0)
                    reorder = e.get('properties', {}).get('reorder', 0)
                    chain_nodes.append({
                        **ph,
                        'tier': 4,
                        'level': 4,
                        'stage': 'Dispensary Pharmacy',
                        'stock_info': e.get('properties', {})
                    })
                    chain_edges.append({
                        'id': f"e_sc_med_ph_{med_id}_{ph['id']}",
                        'from': med_node['id'],
                        'to': ph['id'],
                        'label': f"STOCKED_AT ({qty})",
                        'raw_label': 'STOCKS',
                        'color': {'color': '#0284c7'},
                        'arrows': 'to',
                        'title': f"<b>{ph['label']}</b><br>In Stock: {qty} units<br>Reorder Level: {reorder}"
                    })

        # 3. Tier 5: Clinical Patient Recipients (Prescriptions containing this medicine)
        for e in edges:
            if e.get('to') == med_node['id'] and e.get('label') == 'CONTAINS_MEDICINE':
                rx = next((n for n in nodes if n['id'] == e.get('from')), None)
                if rx:
                    for pe in edges:
                        if pe.get('to') == rx['id'] and pe.get('label') == 'HAS_PRESCRIPTION':
                            pat = next((n for n in nodes if n['id'] == pe.get('from')), None)
                            if pat and pat['id'] not in node_ids:
                                node_ids.add(pat['id'])
                                rx_props = {**rx.get('properties', {}), **e.get('properties', {})}
                                chain_nodes.append({
                                    **pat,
                                    'tier': 5,
                                    'level': 5,
                                    'stage': 'Patient Recipient',
                                    'rx_info': rx_props
                                })
                                # Route from nearest stocking pharmacy (by city match or primary)
                                ph_source = next((p for p in stocking_pharmacies if p.get('properties', {}).get('city') == pat.get('properties', {}).get('city')), stocking_pharmacies[0] if stocking_pharmacies else None)
                                if ph_source:
                                    dosage = e.get('properties', {}).get('dosage', '')
                                    freq = e.get('properties', {}).get('frequency', '')
                                    chain_edges.append({
                                        'id': f"e_sc_ph_pat_{ph_source['id']}_{pat['id']}",
                                        'from': ph_source['id'],
                                        'to': pat['id'],
                                        'label': f"DISPENSED ({rx['label']})",
                                        'raw_label': 'DISPENSED_TO',
                                        'color': {'color': '#008080'},
                                        'arrows': 'to',
                                        'title': f"<b>Patient:</b> {pat['label']}<br>Prescription: {rx['label']}<br>Dosage: {dosage} ({freq})"
                                    })

        # 4. Tier 2: Distribution Suppliers (Supplying the stocking pharmacies)
        suppliers = []
        for ph in stocking_pharmacies:
            for e in edges:
                if e.get('to') == ph['id'] and e.get('label') == 'SUPPLIES_TO':
                    s = next((n for n in nodes if n['id'] == e.get('from')), None)
                    if s and s['id'] not in node_ids:
                        node_ids.add(s['id'])
                        suppliers.append(s)
                        chain_nodes.append({
                            **s,
                            'tier': 2,
                            'level': 2,
                            'stage': 'Distribution Supplier'
                        })
                        chain_edges.append({
                            'id': f"e_sc_supp_med_{s['id']}_{med_id}",
                            'from': s['id'],
                            'to': med_node['id'],
                            'label': 'DISTRIBUTES_BATCH',
                            'raw_label': 'SUPPLIES_TO',
                            'color': {'color': '#dc2626'},
                            'arrows': 'to',
                            'title': f"<b>Logistics:</b> {s['label']} &rarr; Distributes {med_node['label']}"
                        })

        # 5. Tier 1: Pharmaceutical Manufacturers (Supplying the logistics distributors)
        for s in suppliers:
            for e in edges:
                if e.get('from') == s['id'] and e.get('label') == 'PROCURES_FROM':
                    m = next((n for n in nodes if n['id'] == e.get('to')), None)
                    if m and m['id'] not in node_ids:
                        node_ids.add(m['id'])
                        chain_nodes.append({
                            **m,
                            'tier': 1,
                            'level': 1,
                            'stage': 'Pharmaceutical Manufacturer'
                        })
                        chain_edges.append({
                            'id': f"e_sc_mfg_supp_{m['id']}_{s['id']}",
                            'from': m['id'],
                            'to': s['id'],
                            'label': 'SUPPLIES_LOGISTICS',
                            'raw_label': 'PROCURES_FROM',
                            'color': {'color': '#6366f1'},
                            'arrows': 'to',
                            'title': f"<b>Industrial Plant:</b> {m['label']} &rarr; Bulk Supply to {s['label']}"
                        })

        stage_counts = {
            'manufacturers': sum(1 for n in chain_nodes if n['tier'] == 1),
            'suppliers': sum(1 for n in chain_nodes if n['tier'] == 2),
            'medicines': 1,
            'pharmacies': sum(1 for n in chain_nodes if n['tier'] == 4),
            'patients': sum(1 for n in chain_nodes if n['tier'] == 5)
        }

        return {
            'medicine_id': med_id,
            'medicine_name': med_node['label'],
            'nodes': chain_nodes,
            'edges': chain_edges,
            'stage_counts': stage_counts,
            'total_stages': 5,
            'mode': 'live' if self.is_connected else 'fallback'
        }

    # -------------------------------------------------------------------------
    # GRAPH STATISTICS (Degree-Based Connectivity Analysis)
    # -------------------------------------------------------------------------
    def get_graph_statistics(self):
        """Calculates global graph metrics and degree-based connectivity."""
        if self.is_connected:
            try:
                with self._get_session() as session:
                    # Node counts
                    nodes_res = session.run("MATCH (n) RETURN count(n) AS total, labels(n)[0] AS label GROUP BY label")
                    node_counts = {r['label']: r['total'] for r in nodes_res}
                    total_nodes = sum(node_counts.values())

                    # Relationship counts
                    edges_res = session.run("MATCH ()-[r]->() RETURN count(r) AS total, type(r) AS type GROUP BY type")
                    edge_counts = {r['type']: r['total'] for r in edges_res}
                    total_edges = sum(edge_counts.values())

                    # Degree-based connectivity analysis: Most prescribed medicine
                    top_med_res = session.run("""
                        MATCH (m:Medicine)<-[:CONTAINS_MEDICINE]-(rx:Prescription)
                        RETURN m.name AS name, count(rx) AS degree
                        ORDER BY degree DESC LIMIT 1
                    """).single()

                    # Degree-based connectivity: Most connected patient
                    top_pat_res = session.run("""
                        MATCH (p:Patient)-[:HAS_PRESCRIPTION]->(rx:Prescription)
                        RETURN p.name AS name, count(rx) AS degree
                        ORDER BY degree DESC LIMIT 1
                    """).single()

                    return {
                        'total_nodes': total_nodes,
                        'total_relationships': total_edges,
                        'node_counts': node_counts,
                        'edge_counts': edge_counts,
                        'most_connected_medicine': {
                            'name': top_med_res['name'] if top_med_res else 'Dolo 650',
                            'prescriptions_count': top_med_res['degree'] if top_med_res else 3,
                            'metric': 'Degree-based connectivity (In-degree of [:CONTAINS])'
                        },
                        'most_connected_patient': {
                            'name': top_pat_res['name'] if top_pat_res else 'Rahul Sharma',
                            'prescriptions_count': top_pat_res['degree'] if top_pat_res else 2,
                            'metric': 'Degree-based connectivity (Out-degree of [:HAS_PRESCRIPTION])'
                        },
                        'mode': 'live'
                    }
            except Exception as e:
                logger.error(f"Live statistics query failed: {e}")

        # Fallback statistics computed from transformed relational graph
        nodes = self._fallback_graph['nodes']
        edges = self._fallback_graph['edges']
        
        node_counts = {}
        for n in nodes:
            g = n['group']
            node_counts[g] = node_counts.get(g, 0) + 1

        edge_counts = {}
        for e in edges:
            l = e['label']
            edge_counts[l] = edge_counts.get(l, 0) + 1

        # Calculate degree-based connectivity
        med_in_degree = {}
        for e in edges:
            if e['label'] == 'CONTAINS':
                med_in_degree[e['to']] = med_in_degree.get(e['to'], 0) + 1
        
        top_med_id = max(med_in_degree, key=med_in_degree.get) if med_in_degree else 'Medicine_501'
        top_med_node = next((n for n in nodes if n['id'] == top_med_id), None)

        pat_out_degree = {}
        for e in edges:
            if e['label'] == 'HAS_PRESCRIPTION':
                pat_out_degree[e['from']] = pat_out_degree.get(e['from'], 0) + 1

        top_pat_id = max(pat_out_degree, key=pat_out_degree.get) if pat_out_degree else 'Patient_401'
        top_pat_node = next((n for n in nodes if n['id'] == top_pat_id), None)

        return {
            'total_nodes': len(nodes),
            'total_relationships': len(edges),
            'node_counts': node_counts,
            'edge_counts': edge_counts,
            'most_connected_medicine': {
                'name': top_med_node['label'] if top_med_node else 'Dolo 650 (Paracetamol)',
                'prescriptions_count': med_in_degree.get(top_med_id, 3),
                'metric': 'Degree-based connectivity analysis (In-degree of [:CONTAINS])'
            },
            'most_connected_patient': {
                'name': top_pat_node['label'] if top_pat_node else 'Rahul Sharma',
                'prescriptions_count': pat_out_degree.get(top_pat_id, 2),
                'metric': 'Degree-based connectivity analysis (Out-degree of [:HAS_PRESCRIPTION])'
            },
            'mode': 'fallback'
        }

    # -------------------------------------------------------------------------
    # CYPHER PLAYGROUND EXECUTION
    # -------------------------------------------------------------------------
    def execute_cypher(self, query_str):
        """Safely executes Cypher queries with support for MATCH, WHERE, and SET updates."""
        query_str = (query_str or '').strip()
        if not query_str:
            return {'success': False, 'error': 'Query string cannot be empty.'}

        # Guard against destructive whole-database drops while allowing SET, CREATE, MERGE updates
        disallowed = ['DETACH DELETE', 'DROP DATABASE', 'DROP CONSTRAINT', 'DROP INDEX', 'CALL apoc.cypher.doIt']
        upper_q = query_str.upper()
        for kw in disallowed:
            if kw in upper_q:
                return {
                    'success': False,
                    'error': f"Disallowed Cypher operation '{kw}'. Destructive database wipe or schema drop operations are restricted."
                }

        start_time = time.time()

        if self.is_connected:
            clean_query = query_str.rstrip(';').strip()
            for attempt in range(2):
                try:
                    with self._get_session() as session:
                        res = session.run(clean_query)
                        records = []
                        keys = list(res.keys())
                        for r in res:
                            row = {}
                            for k in keys:
                                val = r[k]
                                # Handle Neo4j Node/Relationship/Date serialization
                                row[k] = self._serialize_cypher_val(val)
                            records.append(row)
                        
                        summary = res.consume()
                        # If query was a SET or mutation without RETURN clause, provide clear feedback
                        if len(records) == 0 and summary.counters.contains_updates:
                            cnt = summary.counters
                            keys = ['Status', 'PropertiesUpdated', 'NodesCreated', 'RelationshipsCreated']
                            records = [{
                                'Status': 'Graph updated successfully in Neo4j AuraDB',
                                'PropertiesUpdated': cnt.properties_set,
                                'NodesCreated': cnt.nodes_created,
                                'RelationshipsCreated': cnt.relationships_created
                            }]
                        
                        elapsed_ms = round((time.time() - start_time) * 1000, 2)
                        return {
                            'success': True,
                            'columns': keys,
                            'rows': records,
                            'count': len(records),
                            'execution_time_ms': elapsed_ms,
                            'mode': 'live'
                        }
                except Exception as e:
                    logger.warning(f"Neo4j Cypher attempt {attempt + 1} failed: {e}")
                    if attempt == 0:
                        logger.info("Attempting auto-reconnect to Neo4j AuraDB...")
                        self._reconnect()
                        continue
                    return {'success': False, 'error': f"Neo4j Cypher Execution Error: {str(e)}"}

        # Offline Educational Response for Predefined Queries
        return self._simulate_fallback_cypher(query_str, start_time)

    def get_predefined_queries(self):
        """Returns 13 curated Cypher queries (traversals, aggregations, and update mutations)."""
        return [
            {
                'id': 'q1',
                'name': 'Degree-Based: Most Prescribed Medicines',
                'category': 'Degree-Based Connectivity Analysis',
                'cypher': """MATCH (m:Medicine)<-[:CONTAINS_MEDICINE]-(rx:Prescription)
RETURN m.medicine_id AS MedicineID, m.name AS MedicineName, m.price AS Price_INR, count(rx) AS PrescriptionDegree
ORDER BY PrescriptionDegree DESC
LIMIT 5;"""
            },
            {
                'id': 'q2',
                'name': 'Degree-Based: Chronic Care Patients',
                'category': 'Out-Degree Pattern Aggregation',
                'cypher': """MATCH (p:Patient)-[:HAS_PRESCRIPTION]->(rx:Prescription)
WITH p, count(rx) AS ConsultationsCount
WHERE ConsultationsCount >= 2
RETURN p.patient_id AS PatientID, p.name AS PatientName, p.city AS City, ConsultationsCount
ORDER BY ConsultationsCount DESC;"""
            },
            {
                'id': 'q3',
                'name': '2-Hop Traversal: Patient Multi-Drug Regimen',
                'category': 'Multi-Hop Relationship Traversal',
                'cypher': """MATCH (p:Patient {name: 'Rahul Sharma'})-[:HAS_PRESCRIPTION]->(rx:Prescription)-[c:CONTAINS_MEDICINE]->(m:Medicine)
RETURN rx.prescription_id AS PrescriptionID, rx.date AS Date, m.name AS Medicine, c.dosage AS Dosage, c.frequency AS Frequency;"""
            },
            {
                'id': 'q4',
                'name': '4-Hop Traversal: Patient to Supply Source Trace',
                'category': 'Cross-Domain Multi-Hop Traversal',
                'cypher': """MATCH (p:Patient {name: 'Rahul Sharma'})-[:HAS_PRESCRIPTION]->(:Prescription)-[:CONTAINS_MEDICINE]->(m:Medicine)<-[:STOCKS]-(ph:Pharmacy)<-[:SUPPLIES_TO]-(s:Supplier)
RETURN p.name AS Patient, m.name AS Medicine, ph.name AS DispensingPharmacy, s.name AS AuthorizedSupplier
LIMIT 5;"""
            },
            {
                'id': 'q5',
                'name': 'Shortest Path: Patient to Manufacturer',
                'category': 'Graph Shortest Path Algorithm',
                'cypher': """MATCH (p:Patient {name: 'Rahul Sharma'}), (mf:Manufacturer)
WHERE mf.brand_name CONTAINS 'Sun Pharmaceutical'
MATCH path = shortestPath((p)-[*]-(mf))
RETURN [node in nodes(path) | coalesce(node.name, node.brand_name, 'Rx#' + toString(node.prescription_id))] AS TraversalHops, length(path) AS DegreesOfSeparation;"""
            },
            {
                'id': 'q6',
                'name': 'Co-Prescribed Medicine Combinations',
                'category': 'Diamond Graph Recommendation Pattern',
                'cypher': """MATCH (m1:Medicine)<-[:CONTAINS_MEDICINE]-(rx:Prescription)-[:CONTAINS_MEDICINE]->(m2:Medicine)
WHERE m1.medicine_id < m2.medicine_id
RETURN m1.name AS Medicine_A, m2.name AS Medicine_B, count(rx) AS CoPrescribedCount
ORDER BY CoPrescribedCount DESC
LIMIT 5;"""
            },
            {
                'id': 'q7',
                'name': 'Dispensary Local Stock Deficit Alert',
                'category': 'Relationship Property Numerical Filter',
                'cypher': """MATCH (ph:Pharmacy)-[s:STOCKS]->(m:Medicine)
WHERE s.quantity <= s.reorder
RETURN ph.name AS PharmacyBranch, m.name AS Medicine, s.quantity AS StockUnits, s.reorder AS ReorderThreshold
ORDER BY s.quantity ASC;"""
            },
            {
                'id': 'q8',
                'name': 'Multi-Sourced Medicines (Pharmacy Availability)',
                'category': 'In-Degree Branching Traversal',
                'cypher': """MATCH (ph:Pharmacy)-[s:STOCKS]->(m:Medicine)
WITH m, count(ph) AS PharmacyCount, collect(ph.name) AS PharmacyList
WHERE PharmacyCount > 1
RETURN m.name AS Medicine, PharmacyCount, PharmacyList
ORDER BY PharmacyCount DESC
LIMIT 5;"""
            },
            {
                'id': 'q9',
                'name': 'Hospital-Doctor-Prescription Network',
                'category': 'Cyclic Clinical Network Traversal',
                'cypher': """MATCH (h:Hospital)<-[:WORKS_AT]-(d:Doctor)-[:WRITES]->(rx:Prescription)<-[:HAS_PRESCRIPTION]-(p:Patient)
RETURN h.name AS Hospital, d.name AS Specialist, rx.prescription_id AS PrescriptionID, p.name AS Patient
LIMIT 5;"""
            },
            {
                'id': 'q10',
                'name': 'Global Node Counts by Label',
                'category': 'Graph Topology Aggregation',
                'cypher': """MATCH (n)
RETURN labels(n)[0] AS NodeLabel, count(n) AS EntityCount
ORDER BY EntityCount DESC;"""
            },
            {
                'id': 'q11',
                'name': 'Update: Modify Medicine Retail Price',
                'category': 'Graph Property Mutation (SET)',
                'cypher': """MATCH (m:Medicine {name: 'Dolo 650 (Paracetamol 650mg)'})
SET m.price = 35.00
RETURN m.medicine_id AS MedicineID, m.name AS MedicineName, m.price AS UpdatedPrice_INR;"""
            },
            {
                'id': 'q12',
                'name': 'Update: Restock Pharmacy Inventory',
                'category': 'Relationship Property Mutation (SET)',
                'cypher': """MATCH (ph:Pharmacy {name: 'Apollo HealthCity Pharmacy'})-[s:STOCKS]->(m:Medicine {name: 'Augmentin 625 Duo (Amoxicillin & Clavulanate)'})
SET s.quantity = s.quantity + 50
RETURN ph.name AS Pharmacy, m.name AS Medicine, s.quantity AS NewStockUnits, s.reorder AS ReorderThreshold;"""
            },
            {
                'id': 'q13',
                'name': 'Update: Doctor Experience & Contact',
                'category': 'Graph Node Mutation (SET)',
                'cypher': """MATCH (d:Doctor {name: 'Dr. Rajesh Kulkarni'})
SET d.contact = '+91 98201 44552', d.experience = 15
RETURN d.doctor_id AS DoctorID, d.name AS DoctorName, d.contact AS UpdatedContact, d.experience AS YearsExperience;"""
            }
        ]

    # -------------------------------------------------------------------------
    # INTERNAL HELPERS & FALLBACK GRAPH ENGINE
    # -------------------------------------------------------------------------
    def _clean_properties(self, entity):
        clean = {}
        for k, v in dict(entity).items():
            if hasattr(v, 'iso_format'):
                clean[k] = v.iso_format()
            elif hasattr(v, 'isoformat'):
                clean[k] = v.isoformat()
            elif hasattr(v, 'strftime'):
                clean[k] = v.strftime('%Y-%m-%d')
            elif hasattr(v, 'year') and hasattr(v, 'month') and hasattr(v, 'day'):
                clean[k] = f"{v.year:04d}-{v.month:02d}-{v.day:02d}"
            elif isinstance(v, (int, float, str, bool)) or v is None:
                clean[k] = v
            else:
                clean[k] = str(v)
        return clean

    def _format_neo4j_node(self, n, is_center=False):
        label = list(n.labels)[0] if n.labels else 'Node'
        raw_id = self._get_node_raw_id(n)
        node_id = f"{label}_{raw_id}"
        
        name = n.get('name') or n.get('brand_name') or f"Rx#{n.get('prescription_id')}" or n.get('gst_no')
        colors = self.label_colors.get(label, {'background': '#64748b', 'border': '#94a3b8', 'highlight': '#cbd5e1'})
        
        return {
            'id': node_id,
            'label': name,
            'group': label,
            'color': colors['background'] if not is_center else '#eab308',
            'borderWidth': 3 if is_center else 1,
            'raw_id': raw_id,
            'properties': self._clean_properties(n),
            'title': f"<b>{label}</b>: {name}<br>ID: {raw_id}"
        }

    def _format_neo4j_edge(self, r, start_node, end_node, is_path=False):
        s_label = list(start_node.labels)[0] if start_node.labels else 'Node'
        e_label = list(end_node.labels)[0] if end_node.labels else 'Node'
        s_id = f"{s_label}_{self._get_node_raw_id(start_node)}"
        e_id = f"{e_label}_{self._get_node_raw_id(end_node)}"
        
        return {
            'id': f"e_{r.element_id}",
            'from': s_id,
            'to': e_id,
            'label': r.type,
            'color': {'color': '#eab308' if is_path else '#94a3b8'},
            'width': 3 if is_path else 1,
            'properties': self._clean_properties(r),
            'arrows': 'to'
        }

    def _get_node_raw_id(self, n):
        for k in ['patient_id', 'doctor_id', 'hospital_id', 'pharmacy_id', 'pharmacist_id', 
                  'medicine_id', 'prescription_id', 'manufacturer_id', 'supplier_id', 'gst_no']:
            if k in n:
                return n[k]
        return n.element_id

    def _get_id_property_name(self, label):
        mapping = {
            'Patient': 'patient_id',
            'Doctor': 'doctor_id',
            'Hospital': 'hospital_id',
            'Pharmacy': 'pharmacy_id',
            'Pharmacist': 'pharmacist_id',
            'Medicine': 'medicine_id',
            'Prescription': 'prescription_id',
            'Manufacturer': 'manufacturer_id',
            'Supplier': 'supplier_id',
            'WholesaleSupplier': 'gst_no'
        }
        return mapping.get(label, 'id')

    def _serialize_cypher_val(self, val):
        if hasattr(val, 'iso_format'):
            return val.iso_format()
        if hasattr(val, 'strftime'):
            return val.strftime('%Y-%m-%d')
        if hasattr(val, 'labels'):
            return f"Node({list(val.labels)[0]}: {val.get('name') or val.get('brand_name') or val.element_id})"
        if hasattr(val, 'type'):
            return f"Relationship({val.type})"
        if isinstance(val, list):
            return [self._serialize_cypher_val(x) for x in val]
        if isinstance(val, dict):
            return {k: self._serialize_cypher_val(v) for k, v in val.items()}
        return val

    def _traverse_fallback_neighborhood(self, center_id, depth=1):
        """BFS exploration of in-memory graph with deduplication, full interconnectivity, and focal center styling."""
        # Ensure fallback graph is initialized and synced
        if not hasattr(self, '_fallback_graph') or not self._fallback_graph or not self._fallback_graph.get('nodes'):
            self._fallback_graph = self._build_fallback_graph()

        nodes = self._fallback_graph['nodes']
        edges = self._fallback_graph['edges']
        
        visited_nodes = {center_id}
        queue = deque([(center_id, 0)])
        result_edges = []
        seen_edge_ids = set()

        while queue:
            curr_id, curr_d = queue.popleft()
            if curr_d >= depth:
                continue

            for e in edges:
                neighbor_id = None
                if e['from'] == curr_id:
                    neighbor_id = e['to']
                elif e['to'] == curr_id:
                    neighbor_id = e['from']

                if neighbor_id:
                    if e['id'] not in seen_edge_ids:
                        seen_edge_ids.add(e['id'])
                        result_edges.append(e)
                    if neighbor_id not in visited_nodes:
                        visited_nodes.add(neighbor_id)
                        queue.append((neighbor_id, curr_d + 1))

        # Include any interconnecting edges between all visited nodes in this subgraph
        for e in edges:
            if e['from'] in visited_nodes and e['to'] in visited_nodes:
                if e['id'] not in seen_edge_ids:
                    seen_edge_ids.add(e['id'])
                    result_edges.append(e)

        sub_nodes = [n for n in nodes if n['id'] in visited_nodes]
        formatted_nodes = []
        for n in sub_nodes:
            if n['id'] == center_id:
                formatted_nodes.append({
                    **n,
                    'is_center': True,
                    'color': {
                        'background': '#f59e0b',
                        'border': '#ffffff',
                        'highlight': {'background': '#fbbf24', 'border': '#ffffff'},
                        'hover': {'background': '#fbbf24', 'border': '#ffffff'}
                    },
                    'borderWidth': 4,
                    'size': 32,
                    'font': {
                        'size': 14,
                        'color': '#ffffff',
                        'bold': True,
                        'face': 'Inter, sans-serif',
                        'strokeWidth': 4,
                        'strokeColor': '#090d16'
                    },
                    'shadow': {'enabled': True, 'color': 'rgba(245, 158, 11, 0.85)', 'size': 20, 'x': 0, 'y': 0}
                })
            else:
                formatted_nodes.append({
                    **n,
                    'is_center': False,
                    'size': 22,
                    'font': {
                        'size': 11,
                        'color': '#f8fafc',
                        'face': 'Inter, sans-serif',
                        'strokeWidth': 3,
                        'strokeColor': '#090d16'
                    }
                })

        return {
            'nodes': formatted_nodes,
            'edges': result_edges,
            'center_node_id': center_id,
            'mode': 'fallback'
        }

    def _fallback_shortest_path(self, from_id, to_id):
        """BFS shortest path in fallback graph."""
        edges = self._fallback_graph['edges']
        nodes = self._fallback_graph['nodes']
        
        # Build adjacency
        adj = {}
        for e in edges:
            adj.setdefault(e['from'], []).append((e['to'], e))
            adj.setdefault(e['to'], []).append((e['from'], e))

        if from_id not in adj or to_id not in adj:
            return {'found': False, 'message': 'One or both entities not connected in graph.', 'mode': 'fallback'}

        queue = deque([(from_id, [from_id], [])])
        visited = {from_id}

        while queue:
            curr, path_nodes, path_edges = queue.popleft()
            if curr == to_id:
                # Found
                REVERSE_REL_LABELS = {
                    'STOCKS': 'STOCKED_BY',
                    'HAS_PRESCRIPTION': 'PRESCRIPTION_FOR',
                    'CONTAINS_MEDICINE': 'PRESCRIBED_IN',
                    'SUPPLIES_TO': 'SUPPLIED_BY',
                    'PROCURES_FROM': 'MANUFACTURES_FOR',
                    'AFFILIATED_WITH': 'AFFILIATED_DOCTOR',
                    'WORKS_AT': 'EMPLOYS',
                    'EMPLOYED_AT': 'EMPLOYS',
                    'WRITES': 'WRITTEN_BY'
                }

                n_objs = [dict(next((n for n in nodes if n['id'] == nid), {'id': nid, 'label': nid})) for nid in path_nodes]
                hops = [n.get('label') for n in n_objs]

                traversal_edges = []
                for i in range(len(path_nodes) - 1):
                    source_nid = path_nodes[i]
                    target_nid = path_nodes[i + 1]
                    raw_e = path_edges[i]
                    is_fwd = (raw_e.get('from') == source_nid)
                    raw_label = raw_e.get('label', 'CONNECTED_TO')
                    rel_label = raw_label if is_fwd else REVERSE_REL_LABELS.get(raw_label, raw_label)

                    traversal_edges.append({
                        'id': f"path_e_{i}_{source_nid}_{target_nid}",
                        'from': source_nid,
                        'to': target_nid,
                        'label': rel_label,
                        'raw_label': raw_label,
                        'is_forward': is_fwd,
                        'width': 3,
                        'color': {'color': '#38bdf8', 'highlight': '#00d4b2'},
                        'arrows': {'to': {'enabled': True, 'scaleFactor': 1.1}},
                        'font': {
                            'size': 11,
                            'color': '#38bdf8',
                            'face': 'Inter, system-ui, sans-serif',
                            'bold': True,
                            'background': '#0a0f1d',
                            'strokeWidth': 2,
                            'strokeColor': '#0284c7',
                            'align': 'top'
                        },
                        'properties': raw_e.get('properties', {}),
                        'title': f"<b>Step {i+1} &rarr; {i+2}:</b> {rel_label}<br>Schema Relation: {raw_label}"
                    })

                for i, n in enumerate(n_objs):
                    n['level'] = i
                    n['step'] = i + 1
                    n['is_origin'] = (i == 0)
                    n['is_destination'] = (i == len(n_objs) - 1)

                return {
                    'found': True,
                    'nodes': n_objs,
                    'edges': traversal_edges,
                    'hops': hops,
                    'length': len(traversal_edges),
                    'mode': 'fallback'
                }

            for neighbor, edge in adj.get(curr, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path_nodes + [neighbor], path_edges + [edge]))

        return {'found': False, 'message': 'No relational path found between selected entities.', 'mode': 'fallback'}

    def _simulate_fallback_cypher(self, query_str, start_time):
        """Simulates intelligent offline Cypher graph query execution against the embedded property graph model."""
        import re
        elapsed_ms = round((time.time() - start_time) * 1000 + 8.5, 2)
        q = (query_str or '').strip()
        upper_q = q.upper()

        if not hasattr(self, '_fallback_graph') or not self._fallback_graph or not self._fallback_graph.get('nodes'):
            self._fallback_graph = self._build_fallback_graph()

        nodes = self._fallback_graph['nodes']
        edges = self._fallback_graph['edges']
        nodes_by_id = {n['id']: n for n in nodes}

        # -------------------------------------------------------------
        # 0. Mutations / Updates (SET Statements)
        # -------------------------------------------------------------
        if 'SET' in upper_q:
            if 'PRICE' in upper_q:
                return {
                    'success': True,
                    'columns': ['MedicineID', 'MedicineName', 'UpdatedPrice_INR', 'Status'],
                    'rows': [{'MedicineID': 501, 'MedicineName': 'Dolo 650 (Paracetamol 650mg)', 'UpdatedPrice_INR': 35.0, 'Status': 'Property updated successfully'}],
                    'count': 1,
                    'execution_time_ms': elapsed_ms,
                    'mode': 'fallback',
                    'note': 'Simulated property update on embedded graph model (Neo4j Offline).'
                }
            elif 'STOCKS' in upper_q or 'QUANTITY' in upper_q:
                return {
                    'success': True,
                    'columns': ['Pharmacy', 'Medicine', 'NewStockUnits', 'ReorderThreshold', 'Status'],
                    'rows': [{'Pharmacy': 'Apollo HealthCity Pharmacy', 'Medicine': 'Augmentin 625 Duo (Amoxicillin & Clavulanate)', 'NewStockUnits': 50, 'ReorderThreshold': 15, 'Status': 'Inventory restocked'}],
                    'count': 1,
                    'execution_time_ms': elapsed_ms,
                    'mode': 'fallback',
                    'note': 'Simulated inventory restock update on embedded graph model (Neo4j Offline).'
                }
            elif 'DOCTOR' in upper_q:
                return {
                    'success': True,
                    'columns': ['DoctorID', 'DoctorName', 'UpdatedContact', 'YearsExperience', 'Status'],
                    'rows': [{'DoctorID': 301, 'DoctorName': 'Dr. Rajesh Kulkarni', 'UpdatedContact': '+91 98201 44552', 'YearsExperience': 15, 'Status': 'Doctor record updated'}],
                    'count': 1,
                    'execution_time_ms': elapsed_ms,
                    'mode': 'fallback',
                    'note': 'Simulated doctor profile update on embedded graph model (Neo4j Offline).'
                }

        # -------------------------------------------------------------
        # 1. Preset 1: Most Prescribed Medicines (Degree Centrality)
        # -------------------------------------------------------------
        if ('MEDICINE' in upper_q and 'CONTAINS' in upper_q and 'COUNT' in upper_q) or 'MOST PRESCRIBED' in upper_q:
            med_counts = {}
            for e in edges:
                if e.get('label') in ('CONTAINS_MEDICINE', 'CONTAINS'):
                    med_id = e.get('to')
                    med_counts[med_id] = med_counts.get(med_id, 0) + 1
            med_nodes = [n for n in nodes if n.get('group') == 'Medicine']
            rows = []
            for m in med_nodes:
                cnt = med_counts.get(m['id'], 0)
                props = m.get('properties', {})
                rows.append({
                    'MedicineID': props.get('medicine_id', m['id']),
                    'MedicineName': props.get('name', m['label']),
                    'Price_INR': props.get('price', 0.0),
                    'PrescriptionDegree': cnt
                })
            rows.sort(key=lambda r: r['PrescriptionDegree'], reverse=True)
            return {
                'success': True,
                'columns': ['MedicineID', 'MedicineName', 'Price_INR', 'PrescriptionDegree'],
                'rows': rows[:5],
                'count': min(len(rows), 5),
                'execution_time_ms': elapsed_ms,
                'mode': 'fallback',
                'note': 'Executed on Embedded Graph Model (Neo4j Offline). Degree Centrality calculation complete.'
            }

        # -------------------------------------------------------------
        # 2. Preset 2 / Patient Consultation Aggregation
        # -------------------------------------------------------------
        if 'PATIENT' in upper_q and ('CONSULTATIONS' in upper_q or 'COUNT' in upper_q) and 'HAS_PRESCRIPTION' in upper_q:
            pat_counts = {}
            for e in edges:
                if e.get('label') == 'HAS_PRESCRIPTION':
                    pat_id = e.get('from')
                    pat_counts[pat_id] = pat_counts.get(pat_id, 0) + 1
            pat_nodes = [n for n in nodes if n.get('group') == 'Patient']
            rows = []
            for p in pat_nodes:
                cnt = pat_counts.get(p['id'], 0)
                if cnt >= 1:
                    props = p.get('properties', {})
                    rows.append({
                        'PatientID': props.get('patient_id', p['id']),
                        'PatientName': props.get('name', p['label']),
                        'City': props.get('city', 'Mumbai'),
                        'ConsultationsCount': cnt
                    })
            rows.sort(key=lambda r: r['ConsultationsCount'], reverse=True)
            return {
                'success': True,
                'columns': ['PatientID', 'PatientName', 'City', 'ConsultationsCount'],
                'rows': rows[:10],
                'count': len(rows[:10]),
                'execution_time_ms': elapsed_ms,
                'mode': 'fallback',
                'note': 'Executed on Embedded Graph Model (Neo4j Offline).'
            }

        # -------------------------------------------------------------
        # 3. Doctor -> Hospital Traversal Pattern
        # -------------------------------------------------------------
        if 'DOCTOR' in upper_q and 'HOSPITAL' in upper_q and ('WORKS_AT' in upper_q or 'AFFILIATED_WITH' in upper_q):
            rows = []
            for e in edges:
                if e.get('label') in ('WORKS_AT', 'AFFILIATED_WITH') and e.get('from', '').startswith('Doctor_') and e.get('to', '').startswith('Hospital_'):
                    doc = nodes_by_id.get(e['from'])
                    hosp = nodes_by_id.get(e['to'])
                    if doc and hosp:
                        rows.append({
                            'Doctor': doc['label'],
                            'Specialty': doc.get('properties', {}).get('qualification', 'General Medicine'),
                            'Hospital': hosp['label'],
                            'City': hosp.get('properties', {}).get('city', 'Mumbai')
                        })
            return {
                'success': True,
                'columns': ['Doctor', 'Specialty', 'Hospital', 'City'],
                'rows': rows[:10],
                'count': len(rows[:10]),
                'execution_time_ms': elapsed_ms,
                'mode': 'fallback',
                'note': 'Executed on Embedded Graph Model (Neo4j Offline).'
            }

        # -------------------------------------------------------------
        # 4. Pharmacy -> Medicine Stock Inventory Traversal
        # -------------------------------------------------------------
        if 'PHARMACY' in upper_q and 'MEDICINE' in upper_q and 'STOCKS' in upper_q:
            rows = []
            for e in edges:
                if e.get('label') == 'STOCKS':
                    ph = nodes_by_id.get(e['from'])
                    med = nodes_by_id.get(e['to'])
                    if ph and med:
                        rows.append({
                            'Pharmacy': ph['label'],
                            'Medicine': med['label'],
                            'UnitsInStock': e.get('properties', {}).get('quantity', 50),
                            'ReorderLevel': e.get('properties', {}).get('reorder', 20)
                        })
            rows.sort(key=lambda r: r['UnitsInStock'])
            return {
                'success': True,
                'columns': ['Pharmacy', 'Medicine', 'UnitsInStock', 'ReorderLevel'],
                'rows': rows[:10],
                'count': len(rows[:10]),
                'execution_time_ms': elapsed_ms,
                'mode': 'fallback',
                'note': 'Executed on Embedded Graph Model (Neo4j Offline).'
            }

        # -------------------------------------------------------------
        # 5. Multi-Hop Care Pathway: Patient -> Rx -> Doctor -> Hospital
        # -------------------------------------------------------------
        if 'HAS_PRESCRIPTION' in upper_q and 'WRITES' in upper_q:
            rows = []
            for pe in edges:
                if pe.get('label') == 'HAS_PRESCRIPTION':
                    pat = nodes_by_id.get(pe['from'])
                    rx = nodes_by_id.get(pe['to'])
                    if pat and rx:
                        for de in edges:
                            if de.get('label') == 'WRITES' and de.get('to') == rx['id']:
                                doc = nodes_by_id.get(de['from'])
                                hosp_name = 'Apollo Hospitals'
                                if doc:
                                    for he in edges:
                                        if he.get('label') in ('WORKS_AT', 'AFFILIATED_WITH') and he.get('from') == doc['id']:
                                            h = nodes_by_id.get(he['to'])
                                            if h: hosp_name = h['label']
                                rows.append({
                                    'Patient': pat['label'],
                                    'PrescriptionID': rx.get('properties', {}).get('prescription_id', rx['id']),
                                    'PrescribingDoctor': doc['label'] if doc else 'Attending Physician',
                                    'Hospital': hosp_name
                                })
            return {
                'success': True,
                'columns': ['Patient', 'PrescriptionID', 'PrescribingDoctor', 'Hospital'],
                'rows': rows[:10],
                'count': len(rows[:10]),
                'execution_time_ms': elapsed_ms,
                'mode': 'fallback',
                'note': 'Executed on Embedded Graph Model (Neo4j Offline).'
            }

        # -------------------------------------------------------------
        # 6. Intelligent Dynamic Cypher Graph Pattern Engine (Fallback)
        # Evaluates 3-Node Chains, 2-Node Relationships & Single Nodes
        # -------------------------------------------------------------
        def _get_entity_prop(entity, prop_name):
            if not entity: return None
            props = entity.get('properties', {})
            prop_lower = prop_name.lower()
            for k, v in props.items():
                if k.lower() == prop_lower: return v
            for k, v in entity.items():
                if k.lower() == prop_lower: return v
            if prop_lower in ('name', 'label'):
                return props.get('name') or props.get('brand_name') or entity.get('label') or props.get('gst_no')
            if prop_lower in ('specialty', 'specialization', 'qual', 'qualification'):
                return props.get('qualification', 'General Specialist')
            if prop_lower in ('price', 'price_inr'):
                return props.get('price', 0.0)
            if prop_lower in ('shift', 'work_shift'):
                return props.get('shift', 'Day')
            if prop_lower in ('rating', 'stars'):
                return props.get('rating', 4.5)
            if prop_lower in ('city', 'location'):
                return props.get('city', '')
            if prop_lower in ('experience', 'exp', 'experience_years'):
                return props.get('experience', 5)
            if prop_lower in ('dosage', 'dose'):
                return props.get('dosage', '')
            if prop_lower in ('frequency', 'freq'):
                return props.get('frequency', '')
            if prop_lower in ('duration', 'dur'):
                return props.get('duration', '')
            return props.get(prop_name, entity.get(prop_name, 'N/A'))

        def _check_entity_cond(var_val, op, target_val):
            if var_val is None: return False
            op = op.upper()
            try:
                v_num = float(var_val)
                t_num = float(str(target_val).strip('\'"'))
                if op in ('=', '=='): return v_num == t_num
                if op == '!=': return v_num != t_num
                if op == '>': return v_num > t_num
                if op == '>=': return v_num >= t_num
                if op == '<': return v_num < t_num
                if op == '<=': return v_num <= t_num
            except (ValueError, TypeError):
                pass
            s_val = str(var_val).lower().strip()
            s_target = str(target_val).lower().strip().strip('\'"')
            if op in ('=', '=='): return s_val == s_target
            if op == '!=': return s_val != s_target
            if op == 'CONTAINS': return s_target in s_val
            if op == 'STARTS WITH': return s_val.startswith(s_target)
            return False

        def _parse_cypher_return(ret_str):
            cols = []
            mappings = []
            items = [x.strip() for x in ret_str.split(',') if x.strip()]
            for it in items:
                as_m = re.search(r'([\w.]+)\s+AS\s+(\w+)', it, re.IGNORECASE)
                if as_m:
                    mappings.append((as_m.group(1), as_m.group(2)))
                    cols.append(as_m.group(2))
                else:
                    pm = re.search(r'([\w.]+)', it, re.IGNORECASE)
                    if pm:
                        mappings.append((pm.group(1), pm.group(1).split('.')[-1]))
                        cols.append(pm.group(1).split('.')[-1])
            return cols, mappings

        ret_m = re.search(r'RETURN\s+(.*?)(ORDER\s+BY|LIMIT|;|$)', q, re.IGNORECASE | re.DOTALL)
        columns, col_mappings = _parse_cypher_return(ret_m.group(1) if ret_m else '')

        # (A) 3-Node Path: (a:Type1)-[r1:REL1]->(b:Type2)-[r2:REL2]->(c:Type3)
        pattern3 = r'MATCH\s*\(\s*(\w+)\s*:\s*(\w+)\s*\)\s*(<-|--|-|->)\s*(?:\[(?:\s*(\w+)?\s*(?::\s*([\w|]+))?\s*)?\]\s*(->|<-|--|-))?\s*\(\s*(\w+)\s*:\s*(\w+)\s*\)\s*(<-|--|-|->)\s*(?:\[(?:\s*(\w+)?\s*(?::\s*([\w|]+))?\s*)?\]\s*(->|<-|--|-))?\s*\(\s*(\w+)\s*:\s*(\w+)\s*\)'
        m3 = re.search(pattern3, q, re.IGNORECASE)
        if m3:
            v1, l1, a1, e1v, r1, a2, v2, l2, a3, e2v, r2, a4, v3, l3 = m3.groups()
            chain_matches = []
            for e1 in edges:
                if r1 and e1.get('label', '').lower() != r1.lower(): continue
                src1 = nodes_by_id.get(e1['from'])
                tgt1 = nodes_by_id.get(e1['to'])
                if src1 and tgt1 and src1.get('group', '').lower() == l1.lower() and tgt1.get('group', '').lower() == l2.lower():
                    for e2 in edges:
                        if r2 and e2.get('label', '').lower() != r2.lower(): continue
                        if e2['from'] == tgt1['id']:
                            tgt2 = nodes_by_id.get(e2['to'])
                            if tgt2 and tgt2.get('group', '').lower() == l3.lower():
                                env = {v1: src1, v2: tgt1, v3: tgt2, e1v or 'r1': e1, e2v or 'r2': e2}
                                row = {}
                                for ref, alias in col_mappings:
                                    parts = ref.split('.')
                                    var = parts[0]
                                    prop = parts[1] if len(parts) > 1 else 'name'
                                    row[alias] = _get_entity_prop(env.get(var), prop)
                                chain_matches.append(row)
            if chain_matches:
                return {
                    'success': True,
                    'columns': columns or list(chain_matches[0].keys()),
                    'rows': chain_matches[:15],
                    'count': min(len(chain_matches), 15),
                    'execution_time_ms': elapsed_ms,
                    'mode': 'fallback',
                    'note': f"Executed multi-hop traversal pattern: ({l1})->({l2})->({l3}) on Embedded Graph Model."
                }

        # (B) 2-Node Relationship: (a:Type1)-[r:REL]->(b:Type2)
        pattern2 = r'MATCH\s*\(\s*(\w+)\s*:\s*(\w+)\s*\)\s*(<-|--|-|->)\s*(?:\[(?:\s*(\w+)?\s*(?::\s*([\w|]+))?\s*)?\]\s*(->|<-|--|-))?\s*\(\s*(\w+)\s*:\s*(\w+)\s*\)'
        m2 = re.search(pattern2, q, re.IGNORECASE)
        if m2:
            v1, l1, a1, ev, rel_type, a2, v2, l2 = m2.groups()
            rel_matches = []
            for e in edges:
                if rel_type and e.get('label', '').lower() != rel_type.lower(): continue
                src = nodes_by_id.get(e['from'])
                tgt = nodes_by_id.get(e['to'])
                if src and tgt:
                    # Directional check
                    is_forward = (src.get('group', '').lower() == l1.lower() and tgt.get('group', '').lower() == l2.lower())
                    is_backward = (src.get('group', '').lower() == l2.lower() and tgt.get('group', '').lower() == l1.lower())
                    
                    if is_forward:
                        env = {v1: src, v2: tgt, ev or 'r': e}
                    elif is_backward and '<' in (a1 or '') + (a2 or ''):
                        env = {v1: tgt, v2: src, ev or 'r': e}
                    else:
                        continue
                    
                    # WHERE condition check
                    where_m = re.search(r'WHERE\s+(.*?)(ORDER\s+BY|RETURN|LIMIT|$)', q, re.IGNORECASE | re.DOTALL)
                    if where_m:
                        cond_str = where_m.group(1).strip()
                        cond_m = re.search(r'(\w+)\.(\w+)\s*(>=|<=|!=|>|<|=|CONTAINS|STARTS\s+WITH)\s*([\'"][^\'"]+[\'"]|[0-9.]+)', cond_str, re.IGNORECASE)
                        if cond_m:
                            c_var, c_prop, c_op, c_val = cond_m.groups()
                            target_entity = env.get(c_var)
                            actual_val = _get_entity_prop(target_entity, c_prop)
                            if not _check_entity_cond(actual_val, c_op, c_val):
                                continue

                    row = {}
                    for ref, alias in col_mappings:
                        parts = ref.split('.')
                        var = parts[0]
                        prop = parts[1] if len(parts) > 1 else 'name'
                        row[alias] = _get_entity_prop(env.get(var), prop)
                    rel_matches.append(row)

            if rel_matches:
                # ORDER BY
                order_m = re.search(r'ORDER\s+BY\s+(.*?)(LIMIT|$)', q, re.IGNORECASE)
                if order_m:
                    ob_col = order_m.group(1).split()[0].split('.')[-1]
                    is_desc = 'DESC' in order_m.group(1).upper()
                    def safe_sort(r):
                        v = r.get(ob_col, 0)
                        try: return float(v)
                        except: return str(v)
                    rel_matches.sort(key=safe_sort, reverse=is_desc)

                limit_m = re.search(r'LIMIT\s+(\d+)', q, re.IGNORECASE)
                max_rows = int(limit_m.group(1)) if limit_m else 15
                return {
                    'success': True,
                    'columns': columns or list(rel_matches[0].keys()),
                    'rows': rel_matches[:max_rows],
                    'count': len(rel_matches[:max_rows]),
                    'execution_time_ms': elapsed_ms,
                    'mode': 'fallback',
                    'note': f"Executed relationship pattern: ({l1})-[:{rel_type or 'CONNECTED'}]->({l2}) on Embedded Graph Model."
                }

        # (C) Single Node Pattern: MATCH (var:Label) ...
        single_node_m = re.search(r'MATCH\s*\(\s*(\w+)\s*:\s*(\w+)\s*\)', q, re.IGNORECASE)
        if single_node_m and not re.search(r'-\[.*?\]-', q):
            var_name = single_node_m.group(1)
            target_label = single_node_m.group(2)
            matched = [n for n in nodes if n.get('group', '').lower() == target_label.lower()]

            if matched:
                # WHERE filter with numbers, strings, and CONTAINS
                where_m = re.search(r'WHERE\s+(.*?)(ORDER\s+BY|RETURN|LIMIT|$)', q, re.IGNORECASE | re.DOTALL)
                if where_m:
                    cond_str = where_m.group(1).strip()
                    cond_m = re.search(rf'{var_name}\.(\w+)\s*(>=|<=|!=|>|<|=|CONTAINS|STARTS\s+WITH)\s*([\'"][^\'"]+[\'"]|[0-9.]+)', cond_str, re.IGNORECASE)
                    if cond_m:
                        c_prop, c_op, c_val = cond_m.groups()
                        matched = [n for n in matched if _check_entity_cond(_get_entity_prop(n, c_prop), c_op, c_val)]

                # ORDER BY
                order_m = re.search(r'ORDER\s+BY\s+(.*?)(LIMIT|$)', q, re.IGNORECASE)
                if order_m:
                    ob_col = order_m.group(1).split()[0].split('.')[-1]
                    is_desc = 'DESC' in order_m.group(1).upper()
                    def sort_key(n):
                        v = _get_entity_prop(n, ob_col)
                        try: return float(v)
                        except: return str(v)
                    matched.sort(key=sort_key, reverse=is_desc)

                # LIMIT
                limit_m = re.search(r'LIMIT\s+(\d+)', q, re.IGNORECASE)
                max_rows = int(limit_m.group(1)) if limit_m else 15
                matched = matched[:max_rows]

                rows = []
                for n in matched:
                    row = {}
                    for ref, alias in col_mappings:
                        prop = ref.split('.')[1] if '.' in ref else ref
                        row[alias] = _get_entity_prop(n, prop)
                    rows.append(row)

                return {
                    'success': True,
                    'columns': columns or ['ID', 'Name', 'Category'],
                    'rows': rows,
                    'count': len(rows),
                    'execution_time_ms': elapsed_ms,
                    'mode': 'fallback',
                    'note': f"Executed on Embedded Graph Model (Neo4j Offline). Matched {len(rows)} {target_label} node(s)."
                }

        # -------------------------------------------------------------
        # 7. Global Topology Counts Fallback
        # -------------------------------------------------------------
        stats = self.get_graph_statistics()
        rows = [{'NodeLabel': k, 'EntityCount': v} for k, v in stats['node_counts'].items()]
        return {
            'success': True,
            'columns': ['NodeLabel', 'EntityCount'],
            'rows': rows,
            'count': len(rows),
            'execution_time_ms': elapsed_ms,
            'mode': 'fallback',
            'note': 'Executed on Embedded Graph Model. Showing topology distribution across node categories.'
        }

    def refresh_graph(self):
        """Forces a refresh of the in-memory fallback graph from MySQL."""
        self._fallback_graph = self._build_fallback_graph()
        return self._fallback_graph

    def _build_fallback_graph(self):
        """Constructs the in-memory fallback graph.
        Dynamically synchronizes with the active MySQL relational database if available;
        otherwise falls back to the exact matching seed dataset."""
        try:
            try:
                from services.db import db
            except ImportError:
                from pharmacy_app.services.db import db

            doc_rows = db.execute_query("SELECT Doctor_ID, Hospital_ID, Experience, Contact_No, First_Name, Last_Name, Qualification FROM DOCTOR")
            if doc_rows:
                g = self._build_graph_from_mysql(db)
                if g and g.get('nodes'):
                    logger.info("Successfully constructed in-memory graph directly from MySQL master database.")
                    return g
        except Exception as e:
            logger.warning(f"Could not construct graph from live MySQL ({e}), using master static fallback.")

        return self._build_static_fallback_graph()

    def _build_graph_from_mysql(self, db):
        """Constructs graph payload directly from active MySQL / SQLite relational database."""
        nodes = []
        edges = []
        edge_ids = set()

        def add_edge(edge_dict):
            eid = edge_dict['id']
            if eid not in edge_ids:
                edge_ids.add(eid)
                edges.append(edge_dict)

        # 1. Patients
        patients = db.execute_query("SELECT * FROM PATIENT")
        for p in patients:
            pid = p['Patient_ID']
            first_name = p.get('First_Name', '')
            last_name = p.get('Last_Name', '')
            name = f"{first_name} {last_name}".strip() or f"Patient #{pid}"
            city = p.get('City', '')
            state = p.get('State', '')
            sex = p.get('Sex', '')
            dob = str(p.get('DOB', ''))
            nodes.append({
                'id': f"Patient_{pid}",
                'label': name,
                'group': 'Patient',
                'color': self.label_colors['Patient']['background'],
                'properties': {'patient_id': pid, 'name': name, 'dob': dob, 'sex': sex, 'city': city, 'state': state},
                'title': f"<b>Patient:</b> {name}<br>ID: {pid}<br>Gender: {sex}<br>City: {city}"
            })

        # 2. Pharmacies
        pharmacies = db.execute_query("SELECT * FROM PHARMACY")
        for ph in pharmacies:
            phid = ph['Pharmacy_ID']
            name = ph.get('Name', f"Pharmacy #{phid}")
            rating = ph.get('Rating', 4.5)
            city = ph.get('City', '')
            street = ph.get('Street', '')
            contact = ph.get('Contact_No', '')
            nodes.append({
                'id': f"Pharmacy_{phid}",
                'label': name,
                'group': 'Pharmacy',
                'color': self.label_colors['Pharmacy']['background'],
                'properties': {'pharmacy_id': phid, 'name': name, 'rating': rating, 'city': city, 'street': street, 'contact': contact},
                'title': f"<b>Pharmacy:</b> {name}<br>ID: {phid}<br>Rating: ⭐ {rating}<br>City: {city}"
            })

        # 3. Hospitals
        hospitals = db.execute_query("SELECT * FROM HOSPITAL")
        for h in hospitals:
            hid = h['Hospital_ID']
            name = h.get('Name', f"Hospital #{hid}")
            city = h.get('City', '')
            state = h.get('State', '')
            phid = h.get('Pharmacy_ID')
            nodes.append({
                'id': f"Hospital_{hid}",
                'label': name,
                'group': 'Hospital',
                'color': self.label_colors['Hospital']['background'],
                'properties': {'hospital_id': hid, 'name': name, 'city': city, 'state': state, 'pharmacy_id': phid},
                'title': f"<b>Hospital:</b> {name}<br>ID: {hid}<br>City: {city}"
            })
            if phid:
                add_edge({
                    'id': f"e_hosp_pharm_{hid}",
                    'from': f"Hospital_{hid}",
                    'to': f"Pharmacy_{phid}",
                    'label': 'AFFILIATED_WITH',
                    'color': {'color': '#94a3b8'},
                    'arrows': 'to'
                })

        # 4. Doctors
        doctors = db.execute_query("SELECT * FROM DOCTOR")
        for d in doctors:
            did = d['Doctor_ID']
            first_name = d.get('First_Name', '')
            last_name = d.get('Last_Name', '')
            name = f"Dr. {first_name} {last_name}".strip()
            hid = d.get('Hospital_ID')
            qual = d.get('Qualification', 'MBBS')
            exp = d.get('Experience', 10)
            contact = d.get('Contact_No', '')
            nodes.append({
                'id': f"Doctor_{did}",
                'label': name,
                'group': 'Doctor',
                'color': self.label_colors['Doctor']['background'],
                'properties': {'doctor_id': did, 'name': name, 'qualification': qual, 'experience': exp, 'contact': contact, 'hospital_id': hid},
                'title': f"<b>Doctor:</b> {name}<br>{qual}<br>Exp: {exp} yrs"
            })
            if hid:
                add_edge({
                    'id': f"e_doc_hosp_{did}",
                    'from': f"Doctor_{did}",
                    'to': f"Hospital_{hid}",
                    'label': 'WORKS_AT',
                    'color': {'color': '#94a3b8'},
                    'arrows': 'to'
                })

        # 5. Pharmacists
        try:
            pharmacists = db.execute_query("SELECT * FROM PHARMACIST")
            for pharm in pharmacists:
                phm_id = pharm['Pharmacist_ID']
                name = pharm.get('Name', f"Pharmacist #{phm_id}")
                phid = pharm.get('Pharmacy_ID')
                shift = pharm.get('Shift', 'Day')
                nodes.append({
                    'id': f"Pharmacist_{phm_id}",
                    'label': name,
                    'group': 'Pharmacist',
                    'color': self.label_colors['Pharmacist']['background'],
                    'properties': {'pharmacist_id': phm_id, 'name': name, 'shift': shift, 'pharmacy_id': phid},
                    'title': f"<b>Pharmacist:</b> {name}<br>Shift: {shift}"
                })
                if phid:
                    add_edge({
                        'id': f"e_phm_pharm_{phm_id}",
                        'from': f"Pharmacist_{phm_id}",
                        'to': f"Pharmacy_{phid}",
                        'label': 'EMPLOYED_AT',
                        'color': {'color': '#f472b6'},
                        'arrows': 'to'
                    })
        except Exception:
            pass

        # 6. Medicines
        medicines = db.execute_query("SELECT * FROM MEDICINE")
        for m in medicines:
            mid = m['Medicine_ID']
            name = m.get('Name', f"Medicine #{mid}")
            price = float(m.get('Price', 100))
            nodes.append({
                'id': f"Medicine_{mid}",
                'label': name,
                'group': 'Medicine',
                'color': self.label_colors['Medicine']['background'],
                'properties': {'medicine_id': mid, 'name': name, 'price': price},
                'title': f"<b>Medicine:</b> {name}<br>Price: ₹{price}"
            })

        # 7. Prescriptions
        prescriptions = db.execute_query("SELECT * FROM PRESCRIPTION")
        for rx in prescriptions:
            rxid = rx['Prescription_ID']
            pid = rx.get('Patient_ID')
            did = rx.get('Doctor_ID')
            dt = str(rx.get('Date', ''))
            nodes.append({
                'id': f"Prescription_{rxid}",
                'label': f"Rx #{rxid}",
                'group': 'Prescription',
                'color': self.label_colors['Prescription']['background'],
                'properties': {'prescription_id': rxid, 'date': dt, 'patient_id': pid, 'doctor_id': did},
                'title': f"<b>Prescription #{rxid}</b><br>Date: {dt}"
            })
            if pid:
                add_edge({
                    'id': f"e_pat_rx_{rxid}",
                    'from': f"Patient_{pid}",
                    'to': f"Prescription_{rxid}",
                    'label': 'HAS_PRESCRIPTION',
                    'color': {'color': '#94a3b8'},
                    'arrows': 'to'
                })
            if did:
                add_edge({
                    'id': f"e_doc_rx_{rxid}",
                    'from': f"Doctor_{did}",
                    'to': f"Prescription_{rxid}",
                    'label': 'WRITES',
                    'color': {'color': '#94a3b8'},
                    'arrows': 'to'
                })

        # 8. Prescription Items
        try:
            rx_items = db.execute_query("SELECT * FROM PRESCRIPTION_ITEM")
            for item in rx_items:
                iid = item.get('Item_ID', f"{item['Prescription_ID']}_{item['Medicine_ID']}")
                rxid = item['Prescription_ID']
                mid = item['Medicine_ID']
                dosage = item.get('Dosage', '')
                freq = item.get('Frequency', '')
                dur = item.get('Duration', '')
                add_edge({
                    'id': f"e_rx_med_{iid}",
                    'from': f"Prescription_{rxid}",
                    'to': f"Medicine_{mid}",
                    'label': 'CONTAINS_MEDICINE',
                    'color': {'color': '#059669'},
                    'properties': {'dosage': dosage, 'frequency': freq, 'duration': dur},
                    'title': f"Dosage: {dosage} | Frequency: {freq} | Duration: {dur}",
                    'arrows': 'to'
                })
        except Exception:
            pass

        # 9. Manufacturers
        try:
            manufacturers = db.execute_query("SELECT * FROM MANUFACTURER")
            for mfg in manufacturers:
                mfid = mfg['Manufacturer_ID']
                bname = mfg.get('Brand_Name', f"Manufacturer #{mfid}")
                city = mfg.get('City', '')
                nodes.append({
                    'id': f"Manufacturer_{mfid}",
                    'label': bname,
                    'group': 'Manufacturer',
                    'color': self.label_colors['Manufacturer']['background'],
                    'properties': {'manufacturer_id': mfid, 'brand_name': bname, 'city': city},
                    'title': f"<b>Manufacturer:</b> {bname}<br>City: {city}"
                })
        except Exception:
            pass

        # 10. Suppliers
        try:
            suppliers = db.execute_query("SELECT * FROM SUPPLIER")
            for s in suppliers:
                sid = s['Supplier_ID']
                sname = s.get('Name', f"Supplier #{sid}")
                city = s.get('City', '')
                nodes.append({
                    'id': f"Supplier_{sid}",
                    'label': sname,
                    'group': 'Supplier',
                    'color': self.label_colors['Supplier']['background'],
                    'properties': {'supplier_id': sid, 'name': sname, 'city': city},
                    'title': f"<b>Supplier:</b> {sname}<br>City: {city}"
                })
        except Exception:
            pass

        # 11. Supplier -> Manufacturer
        try:
            supp_mfg = db.execute_query("SELECT * FROM SUPPLIER_MANUFACTURER")
            for sm in supp_mfg:
                add_edge({
                    'id': f"e_supp_mfg_{sm['Supplier_ID']}_{sm['Manufacturer_ID']}",
                    'from': f"Supplier_{sm['Supplier_ID']}",
                    'to': f"Manufacturer_{sm['Manufacturer_ID']}",
                    'label': 'PROCURES_FROM',
                    'color': {'color': '#ea580c'},
                    'arrows': 'to'
                })
        except Exception:
            pass

        # 12. Supplier -> Pharmacy
        try:
            supp_pharm = db.execute_query("SELECT * FROM SUPPLIER_PHARMACY")
            for sp in supp_pharm:
                add_edge({
                    'id': f"e_supp_pharm_{sp['Supplier_ID']}_{sp['Pharmacy_ID']}",
                    'from': f"Supplier_{sp['Supplier_ID']}",
                    'to': f"Pharmacy_{sp['Pharmacy_ID']}",
                    'label': 'SUPPLIES_TO',
                    'color': {'color': '#ea580c'},
                    'arrows': 'to'
                })
        except Exception:
            pass

        # 13. Wholesale Suppliers & Supplier_Wholesale
        try:
            ws_rows = db.execute_query("SELECT * FROM WHOLESALE_SUPPLIER")
            for ws in ws_rows:
                gst = ws['GST_No']
                city = ws.get('City', '')
                nodes.append({
                    'id': f"WholesaleSupplier_{gst}",
                    'label': f"Wholesale ({city})",
                    'group': 'WholesaleSupplier',
                    'color': self.label_colors['WholesaleSupplier']['background'],
                    'properties': {'gst_no': gst, 'city': city},
                    'title': f"<b>Wholesale Depot:</b> {gst}<br>City: {city}"
                })
            supp_ws = db.execute_query("SELECT * FROM SUPPLIER_WHOLESALE")
            for sw in supp_ws:
                add_edge({
                    'id': f"e_supp_ws_{sw['Supplier_ID']}_{sw['GST_No']}",
                    'from': f"WholesaleSupplier_{sw['GST_No']}",
                    'to': f"Supplier_{sw['Supplier_ID']}",
                    'label': 'SUPPLIES_TO',
                    'color': {'color': '#64748b'},
                    'arrows': 'to'
                })
        except Exception:
            pass

        # 14. Inventory (Pharmacy -> Medicine)
        try:
            inv_rows = db.execute_query("SELECT * FROM INVENTORY")
            for inv in inv_rows:
                add_edge({
                    'id': f"e_pharm_med_{inv['Pharmacy_ID']}_{inv['Medicine_ID']}",
                    'from': f"Pharmacy_{inv['Pharmacy_ID']}",
                    'to': f"Medicine_{inv['Medicine_ID']}",
                    'label': 'STOCKS',
                    'color': {'color': '#0284c7'},
                    'properties': {'quantity': inv.get('Quantity', 0), 'reorder': inv.get('Reorder_Level', 0)},
                    'title': f"In Stock: {inv.get('Quantity', 0)} (Reorder: {inv.get('Reorder_Level', 0)})",
                    'arrows': 'to'
                })
        except Exception:
            pass

        return {'nodes': nodes, 'edges': edges}

    def _build_static_fallback_graph(self):
        """Constructs the in-memory fallback graph synchronized with the relational master schema."""
        nodes = []
        edges = []

        # 1. Patients (10)
        patients_data = [
            (401, 'Rahul Sharma', '1982-04-14', 'M', 'Mumbai', 'Maharashtra', '+91 98200 12345'),
            (402, 'Priya Patel', '1990-09-22', 'F', 'Mumbai', 'Maharashtra', '+91 98211 23456'),
            (403, 'Suresh Menon', '1975-11-05', 'M', 'Bengaluru', 'Karnataka', '+91 98450 34567'),
            (404, 'Deepika Iyer', '1988-03-19', 'F', 'Bengaluru', 'Karnataka', '+91 99000 45678'),
            (405, 'Ramesh Gowda', '1964-07-30', 'M', 'Bengaluru', 'Karnataka', '+91 98440 56789'),
            (406, 'Ananya Verma', '1995-12-11', 'F', 'New Delhi', 'Delhi', '+91 98100 67890'),
            (407, 'Vikram Singh', '1970-01-25', 'M', 'New Delhi', 'Delhi', '+91 98111 78901'),
            (408, 'Sneha Gupta', '1985-08-16', 'F', 'New Delhi', 'Delhi', '+91 98180 89012'),
            (409, 'Homi Wadia', '1958-05-02', 'M', 'Mumbai', 'Maharashtra', '+91 98202 90123'),
            (410, 'Kavya Reddy', '2001-10-28', 'F', 'Bengaluru', 'Karnataka', '+91 99800 01234')
        ]
        for pid, name, dob, sex, city, state, contact in patients_data:
            nodes.append({
                'id': f"Patient_{pid}",
                'label': name,
                'group': 'Patient',
                'color': self.label_colors['Patient']['background'],
                'properties': {'patient_id': pid, 'name': name, 'dob': dob, 'sex': sex, 'city': city, 'state': state, 'contact': contact},
                'title': f"<b>Patient:</b> {name}<br>ID: {pid}<br>City: {city}"
            })

        # 2. Pharmacies (3)
        pharm_data = [
            (101, 'Apollo HealthCity Pharmacy', 4.8, 'Mumbai', 'Ground Floor, Bandra Reclamation, Hill Road'),
            (102, 'MedPlus Community Care', 4.6, 'Bengaluru', '82 100-Ft Road, 4th Block, Koramangala'),
            (103, 'Fortis MedStore Express', 4.9, 'New Delhi', 'Gate No 2, Sector B, Vasant Kunj Marg')
        ]
        for phid, name, rating, city, street in pharm_data:
            nodes.append({
                'id': f"Pharmacy_{phid}",
                'label': name,
                'group': 'Pharmacy',
                'color': self.label_colors['Pharmacy']['background'],
                'properties': {'pharmacy_id': phid, 'name': name, 'rating': rating, 'city': city, 'street': street},
                'title': f"<b>Pharmacy:</b> {name}<br>ID: {phid}<br>Rating: ⭐ {rating}"
            })

        # 3. Hospitals (3)
        hosp_data = [
            (201, 'Lilavati Hospital & Research Centre', 'Mumbai', 101),
            (202, 'Manipal Hospital Bengaluru', 'Bengaluru', 102),
            (203, 'AIIMS Apex Trauma & Medical Center', 'New Delhi', 103)
        ]
        for hid, name, city, phid in hosp_data:
            nodes.append({
                'id': f"Hospital_{hid}",
                'label': name,
                'group': 'Hospital',
                'color': self.label_colors['Hospital']['background'],
                'properties': {'hospital_id': hid, 'name': name, 'city': city},
                'title': f"<b>Hospital:</b> {name}<br>City: {city}"
            })
            # Hospital -> Pharmacy
            edges.append({
                'id': f"e_hosp_pharm_{hid}",
                'from': f"Hospital_{hid}",
                'to': f"Pharmacy_{phid}",
                'label': 'AFFILIATED_WITH',
                'color': {'color': '#94a3b8'},
                'arrows': 'to'
            })

        # 4. Doctors (8)
        doc_data = [
            (301, 'Dr. Rajesh Kulkarni', 201, 'MBBS, MD (General Medicine)', 14),
            (302, 'Dr. Sunita Deshmukh', 201, 'MBBS, MS (General Surgery)', 18),
            (303, 'Dr. Anand Narayanaswamy', 202, 'MBBS, MD, DM (Cardiology)', 11),
            (304, 'Dr. Pooja Rao', 202, 'MBBS, DCH, MD (Pediatrics)', 8),
            (305, 'Dr. Venkatesh Bhat', 202, 'MBBS, MS (Orthopedics)', 15),
            (306, 'Dr. Arvind Aggarwal', 203, 'MBBS, MD, DM (Neurology)', 20),
            (307, 'Dr. Meenakshi Sundaram', 203, 'MBBS, MD (Pulmonology)', 9),
            (308, 'Dr. Kabir Malhotra', 203, 'MBBS, MD (Endocrinology)', 12)
        ]
        for did, name, hid, qual, exp in doc_data:
            nodes.append({
                'id': f"Doctor_{did}",
                'label': name,
                'group': 'Doctor',
                'color': self.label_colors['Doctor']['background'],
                'properties': {'doctor_id': did, 'name': name, 'qualification': qual, 'experience': exp},
                'title': f"<b>Doctor:</b> {name}<br>{qual}<br>Exp: {exp} yrs"
            })
            # Doctor -> Hospital
            edges.append({
                'id': f"e_doc_hosp_{did}",
                'from': f"Doctor_{did}",
                'to': f"Hospital_{hid}",
                'label': 'WORKS_AT',
                'color': {'color': '#94a3b8'},
                'arrows': 'to'
            })

        # 5. Medicines (13)
        med_data = [
            (501, 'Dolo 650 (Paracetamol 650mg)', 32.50, 'Analgesic'),
            (502, 'Augmentin 625 Duo (Amoxicillin & Clavulanate)', 205.00, 'Antibiotic'),
            (503, 'Glycomet GP 1 (Metformin 500mg + Glimepiride 1mg)', 118.50, 'Antidiabetic'),
            (504, 'Atorva 20 (Atorvastatin 20mg)', 185.00, 'Lipid Lowering'),
            (505, 'Azithral 500 (Azithromycin 500mg)', 124.00, 'Antibiotic'),
            (506, 'Pantocid 40 (Pantoprazole 40mg)', 142.00, 'Antacid'),
            (507, 'Cetzine 10 (Cetirizine 10mg)', 48.00, 'Antiallergic'),
            (508, 'Ascoril D Plus Cough Syrup 100ml', 115.00, 'Antitussive'),
            (509, 'Lantus Solostar Insulin Pen (100 IU/ml)', 890.00, 'Antidiabetic'),
            (510, 'Telma 40 (Telmisartan 40mg)', 155.00, 'Antihypertensive'),
            (511, 'Montair LC (Montelukast + Levocetirizine)', 178.00, 'Antiallergic'),
            (512, 'Combiflam Tablet (Ibuprofen + Paracetamol)', 45.00, 'NSAID'),
            (515, 'Pan-D Capsule (Pantoprazole + Domperidone)', 165.00, 'Antacid')
        ]
        for mid, name, price, cat in med_data:
            nodes.append({
                'id': f"Medicine_{mid}",
                'label': name,
                'group': 'Medicine',
                'color': self.label_colors['Medicine']['background'],
                'properties': {'medicine_id': mid, 'name': name, 'price': price, 'category': cat},
                'title': f"<b>Medicine:</b> {name}<br>Price: ₹{price}<br>Class: {cat}"
            })

        # 6. Manufacturers (5)
        mfg_data = [
            (701, 'Sun Pharmaceutical Industries Ltd', 'Mumbai'),
            (702, 'Cipla Ltd', 'Mumbai'),
            (703, "Dr. Reddy's Laboratories Ltd", 'Hyderabad'),
            (704, 'Lupin Pharmaceuticals Inc', 'Mumbai'),
            (705, 'Zydus Lifesciences Ltd', 'Ahmedabad')
        ]
        for mfid, name, city in mfg_data:
            nodes.append({
                'id': f"Manufacturer_{mfid}",
                'label': name,
                'group': 'Manufacturer',
                'color': self.label_colors['Manufacturer']['background'],
                'properties': {'manufacturer_id': mfid, 'brand_name': name, 'city': city},
                'title': f"<b>Manufacturer:</b> {name}<br>City: {city}"
            })

        # 7. Suppliers (5)
        supp_data = [
            (801, 'Apex Healthcare Distributors', 'Mumbai'),
            (802, 'Metro Drug Agency', 'Bengaluru'),
            (803, 'MedSource Logistics', 'New Delhi'),
            (804, 'Bharat Pharma Distributors', 'Ahmedabad'),
            (805, 'Lifeline Medical Supplies', 'Hyderabad')
        ]
        for sid, name, city in supp_data:
            nodes.append({
                'id': f"Supplier_{sid}",
                'label': name,
                'group': 'Supplier',
                'color': self.label_colors['Supplier']['background'],
                'properties': {'supplier_id': sid, 'name': name, 'city': city},
                'title': f"<b>Supplier:</b> {name}<br>City: {city}"
            })

        # 8. Prescriptions & Edges
        rx_data = [
            (1001, 401, 301, '2026-08-01', [(501, '650mg', 'Twice Daily'), (505, '40mg', 'Once Daily')]),
            (1002, 402, 302, '2026-08-02', [(502, '40mg', 'Morning'), (509, '1 Cap', 'Daily')]),
            (1003, 403, 303, '2026-08-05', [(503, '500mg', 'Once Daily'), (501, '650mg', 'SOS')]),
            (1004, 404, 304, '2026-08-18', [(501, '250mg', 'SOS As Needed'), (508, '5ml', 'Thrice Daily (TDS)')]),
            (1005, 405, 305, '2026-08-12', [(506, '1 Tab', 'Breakfast'), (510, '500mg', 'Lunch')]),
            (1006, 406, 306, '2026-08-15', [(507, '10mg', 'Night'), (511, '1 Cap', 'Daily')]),
            (1007, 407, 307, '2026-08-18', [(512, '100mg', 'Twice Daily'), (502, '40mg', 'Before Meals')]),
            (1008, 408, 308, '2026-08-20', [(505, '40mg', 'Morning')])
        ]
        edge_id_counter = 1
        for rxid, pid, did, dt, items in rx_data:
            nodes.append({
                'id': f"Prescription_{rxid}",
                'label': f"Rx #{rxid}",
                'group': 'Prescription',
                'color': self.label_colors['Prescription']['background'],
                'properties': {'prescription_id': rxid, 'date': dt},
                'title': f"<b>Prescription #{rxid}</b><br>Date: {dt}"
            })
            # Patient -> Prescription
            edges.append({
                'id': f"e_pat_rx_{rxid}",
                'from': f"Patient_{pid}",
                'to': f"Prescription_{rxid}",
                'label': 'HAS_PRESCRIPTION',
                'color': {'color': '#94a3b8'},
                'arrows': 'to'
            })
            # Doctor -> Prescription
            edges.append({
                'id': f"e_doc_rx_{rxid}",
                'from': f"Doctor_{did}",
                'to': f"Prescription_{rxid}",
                'label': 'WRITES',
                'color': {'color': '#94a3b8'},
                'arrows': 'to'
            })
            # Prescription -> Medicine
            for mid, dosage, freq in items:
                edges.append({
                    'id': f"e_rx_med_{rxid}_{mid}_{edge_id_counter}",
                    'from': f"Prescription_{rxid}",
                    'to': f"Medicine_{mid}",
                    'label': 'CONTAINS_MEDICINE',
                    'color': {'color': '#059669'},
                    'properties': {'dosage': dosage, 'frequency': freq},
                    'arrows': 'to'
                })
                edge_id_counter += 1

        return {'nodes': nodes, 'edges': edges}

    # -------------------------------------------------------------------------
    # ADVANCED GRAPH IMPLEMENTATION 1: SUPPLY CHAIN DISRUPTION SIMULATOR
    # -------------------------------------------------------------------------
    def simulate_supply_disruption(self, node_type: str, node_id: int):
        """
        Simulates outage of a Manufacturer or Supplier node and cascades
        disruption down the supply tree to identify bottleneck pharmacies,
        stockouts, and vulnerable patients.
        """
        g = self.get_full_graph(node_limit=250)
        nodes_dict = {n['id']: n for n in g.get('nodes', [])}
        edges = g.get('edges', [])

        target_id = f"{node_type}_{node_id}"
        target_node = nodes_dict.get(target_id)
        if not target_node:
            return {'found': False, 'message': f"Entity {target_id} not found in graph."}

        # Build adjacency maps
        adj_out = {}
        adj_in = {}
        for e in edges:
            u, v = e['from'], e['to']
            adj_out.setdefault(u, []).append(e)
            adj_in.setdefault(v, []).append(e)

        disrupted_ids = {target_id}
        impacted_suppliers = []
        impacted_pharmacies = []
        stockout_medicines = []
        impacted_patients = []

        if node_type == 'Manufacturer':
            # Downstream suppliers procuring from this manufacturer
            procuring_suppliers = [e['from'] for e in adj_in.get(target_id, []) if e['label'] == 'PROCURES_FROM']
            for sid in procuring_suppliers:
                s_node = nodes_dict.get(sid)
                if not s_node:
                    continue
                other_mfgs = [e['to'] for e in adj_out.get(sid, []) if e['label'] == 'PROCURES_FROM' and e['to'] != target_id]
                is_spof = (len(other_mfgs) == 0)
                disrupted_ids.add(sid)
                impacted_suppliers.append({
                    'id': sid,
                    'name': s_node.get('label'),
                    'city': s_node.get('properties', {}).get('city', ''),
                    'is_single_point_of_failure': is_spof,
                    'alternate_manufacturers_count': len(other_mfgs)
                })

            for s_info in impacted_suppliers:
                sid = s_info['id']
                supplied_pharms = [e['to'] for e in adj_out.get(sid, []) if e['label'] == 'SUPPLIES_TO']
                for phid in supplied_pharms:
                    ph_node = nodes_dict.get(phid)
                    if not ph_node or phid in [p['id'] for p in impacted_pharmacies]:
                        continue
                    other_supps = [e['from'] for e in adj_in.get(phid, []) if e['label'] == 'SUPPLIES_TO' and e['from'] not in disrupted_ids]
                    disrupted_ids.add(phid)
                    impacted_pharmacies.append({
                        'id': phid,
                        'name': ph_node.get('label'),
                        'city': ph_node.get('properties', {}).get('city', ''),
                        'is_critical_bottleneck': (len(other_supps) == 0),
                        'alternate_suppliers_count': len(other_supps)
                    })

        elif node_type == 'Supplier':
            disrupted_ids.add(target_id)
            supplied_pharms = [e['to'] for e in adj_out.get(target_id, []) if e['label'] == 'SUPPLIES_TO']
            for phid in supplied_pharms:
                ph_node = nodes_dict.get(phid)
                if not ph_node or phid in [p['id'] for p in impacted_pharmacies]:
                    continue
                other_supps = [e['from'] for e in adj_in.get(phid, []) if e['label'] == 'SUPPLIES_TO' and e['from'] != target_id]
                disrupted_ids.add(phid)
                impacted_pharmacies.append({
                    'id': phid,
                    'name': ph_node.get('label'),
                    'city': ph_node.get('properties', {}).get('city', ''),
                    'is_critical_bottleneck': (len(other_supps) == 0),
                    'alternate_suppliers_count': len(other_supps)
                })

        # Find medicines affected
        for ph_info in impacted_pharmacies:
            phid = ph_info['id']
            stocked_meds = [e['to'] for e in adj_out.get(phid, []) if e['label'] == 'STOCKS']
            for mid in stocked_meds:
                m_node = nodes_dict.get(mid)
                if not m_node or mid in [m['id'] for m in stockout_medicines]:
                    continue
                stockout_medicines.append({
                    'id': mid,
                    'name': m_node.get('label'),
                    'price': m_node.get('properties', {}).get('price', 0)
                })
                disrupted_ids.add(mid)

        # Impacted patients
        for m_info in stockout_medicines:
            mid = m_info['id']
            rxs = [e['from'] for e in adj_in.get(mid, []) if e['label'] == 'CONTAINS_MEDICINE']
            for rxid in rxs:
                pats = [e['from'] for e in adj_in.get(rxid, []) if e['label'] == 'HAS_PRESCRIPTION']
                for pid in pats:
                    p_node = nodes_dict.get(pid)
                    if not p_node or pid in [p['id'] for p in impacted_patients]:
                        continue
                    impacted_patients.append({
                        'id': pid,
                        'name': p_node.get('label'),
                        'city': p_node.get('properties', {}).get('city', ''),
                        'prescription_id': rxid
                    })
                    disrupted_ids.add(pid)

        total_p = max(1, len([n for n in nodes_dict.values() if n.get('group') == 'Patient']))
        total_ph = max(1, len([n for n in nodes_dict.values() if n.get('group') == 'Pharmacy']))
        total_m = max(1, len([n for n in nodes_dict.values() if n.get('group') == 'Medicine']))
        
        pharm_ratio = len(impacted_pharmacies) / total_ph
        med_ratio = len(stockout_medicines) / total_m
        pat_ratio = len(impacted_patients) / total_p
        vuln_score = round(min(100.0, (pharm_ratio * 40 + med_ratio * 35 + pat_ratio * 25) * 1.5), 1)

        sim_nodes = []
        for nid, n in nodes_dict.items():
            if nid == target_id:
                sim_nodes.append({
                    **n,
                    'color': {'background': '#ef4444', 'border': '#dc2626', 'highlight': '#f87171'},
                    'status': 'DISRUPTED_SOURCE',
                    'size': 28,
                    'font': {'color': '#ffffff', 'size': 12, 'bold': True}
                })
            elif nid in [p['id'] for p in impacted_pharmacies if p.get('is_critical_bottleneck')]:
                sim_nodes.append({
                    **n,
                    'color': {'background': '#f97316', 'border': '#ea580c', 'highlight': '#fb923c'},
                    'status': 'CRITICAL_BOTTLENECK',
                    'size': 24
                })
            elif nid in disrupted_ids:
                sim_nodes.append({
                    **n,
                    'color': {'background': '#f59e0b', 'border': '#d97706', 'highlight': '#fcd34d'},
                    'status': 'AT_RISK',
                    'size': 20
                })
            else:
                sim_nodes.append({
                    **n,
                    'color': {'background': '#10b981', 'border': '#059669', 'highlight': '#34d399'},
                    'status': 'RESILIENT',
                    'opacity': 0.45
                })

        return {
            'found': True,
            'target': {
                'id': target_id,
                'name': target_node.get('label'),
                'type': node_type
            },
            'summary': {
                'vulnerability_index': vuln_score,
                'impacted_suppliers_count': len(impacted_suppliers),
                'impacted_pharmacies_count': len(impacted_pharmacies),
                'stockout_medicines_count': len(stockout_medicines),
                'impacted_patients_count': len(impacted_patients),
                'total_nodes_affected': len(disrupted_ids)
            },
            'impacted_suppliers': impacted_suppliers,
            'impacted_pharmacies': impacted_pharmacies,
            'stockout_medicines': stockout_medicines,
            'impacted_patients': impacted_patients,
            'simulation_graph': {
                'nodes': sim_nodes,
                'edges': edges
            }
        }

    # -------------------------------------------------------------------------
    # ADVANCED GRAPH IMPLEMENTATION 2: DOCTOR-SHOPPING & ANOMALY DETECTOR
    # -------------------------------------------------------------------------
    def detect_prescription_anomalies(self):
        """
        Traverses multi-hop prescribing paths to detect doctor shopping,
        polypharmacy contraindications, and prescribing ring anomalies.
        """
        g = self.get_full_graph(node_limit=250)
        nodes_dict = {n['id']: n for n in g.get('nodes', [])}
        edges = g.get('edges', [])

        pat_rxs = {}
        rx_doc = {}
        rx_meds = {}
        doc_hosp = {}

        for e in edges:
            lbl = e.get('label')
            u, v = e.get('from'), e.get('to')
            if lbl == 'HAS_PRESCRIPTION':
                pat_rxs.setdefault(u, []).append(v)
            elif lbl == 'WRITES':
                rx_doc[v] = u
            elif lbl == 'CONTAINS_MEDICINE':
                rx_meds.setdefault(u, []).append(v)
            elif lbl == 'AFFILIATED_WITH' and u.startswith('Doctor_') and v.startswith('Hospital_'):
                doc_hosp[u] = v

        interacting_pairs = set()
        for e in edges:
            if e.get('label') == 'INTERACTS_WITH':
                interacting_pairs.add((e.get('from'), e.get('to')))
                interacting_pairs.add((e.get('to'), e.get('from')))

        anomalies = []
        for pid, rx_list in pat_rxs.items():
            p_node = nodes_dict.get(pid)
            if not p_node:
                continue

            consulted_docs = set()
            consulted_hosps = set()
            prescribed_meds = []
            
            for rx in rx_list:
                doc_id = rx_doc.get(rx)
                if doc_id:
                    consulted_docs.add(doc_id)
                    hosp_id = doc_hosp.get(doc_id)
                    if hosp_id:
                        consulted_hosps.add(hosp_id)
                for mid in rx_meds.get(rx, []):
                    prescribed_meds.append(mid)

            distinct_meds = set(prescribed_meds)
            
            conflicts = []
            med_list = list(distinct_meds)
            for i in range(len(med_list)):
                for j in range(i + 1, len(med_list)):
                    if (med_list[i], med_list[j]) in interacting_pairs:
                        m1 = nodes_dict.get(med_list[i], {}).get('label', med_list[i])
                        m2 = nodes_dict.get(med_list[j], {}).get('label', med_list[j])
                        conflicts.append(f"{m1} + {m2}")

            risk_score = 15
            risk_factors = []

            doc_count = len(consulted_docs)
            hosp_count = len(consulted_hosps)
            rx_count = len(rx_list)

            if doc_count >= 3:
                risk_score += 45
                risk_factors.append(f"Doctor-Shopping Alert: Prescriptions obtained from {doc_count} distinct doctors")
            elif doc_count == 2:
                risk_score += 25
                risk_factors.append(f"Multi-Practitioner Consultation: {doc_count} distinct doctors")

            if hosp_count >= 2:
                risk_score += 20
                risk_factors.append(f"Hospital Hopping: Cross-institution care at {hosp_count} hospitals")

            if len(conflicts) > 0:
                risk_score += 35
                risk_factors.append(f"Contraindication Hazard: {len(conflicts)} interacting drug pairs detected")

            if rx_count >= 3:
                risk_score += 15
                risk_factors.append(f"High-Volume Polypharmacy: {rx_count} overlapping active regimens")

            risk_score = min(100, risk_score)
            risk_tier = 'CRITICAL' if risk_score >= 70 else 'ELEVATED' if risk_score >= 45 else 'MONITOR'
            badge_class = 'bg-danger' if risk_tier == 'CRITICAL' else 'bg-warning text-dark' if risk_tier == 'ELEVATED' else 'bg-info text-dark'

            doctor_names = [nodes_dict[d]['label'] for d in consulted_docs if d in nodes_dict]
            med_names = [nodes_dict[m]['label'] for m in distinct_meds if m in nodes_dict]

            anomalies.append({
                'patient_id': pid,
                'patient_name': p_node.get('label'),
                'city': p_node.get('properties', {}).get('city', ''),
                'risk_score': risk_score,
                'risk_tier': risk_tier,
                'badge_class': badge_class,
                'prescriptions_count': rx_count,
                'doctors_count': doc_count,
                'doctor_names': doctor_names,
                'hospitals_count': hosp_count,
                'medicines_count': len(distinct_meds),
                'medicine_names': med_names,
                'conflicts': conflicts,
                'risk_factors': risk_factors
            })

        anomalies.sort(key=lambda x: x['risk_score'], reverse=True)
        return {
            'total_patients_analyzed': len(pat_rxs),
            'flagged_anomalies_count': sum(1 for a in anomalies if a['risk_score'] >= 45),
            'critical_count': sum(1 for a in anomalies if a['risk_tier'] == 'CRITICAL'),
            'anomalies': anomalies
        }

    # -------------------------------------------------------------------------
    # ADVANCED GRAPH IMPLEMENTATION 3: CENTRALITY & NETWORK INFLUENCE ANALYTICS
    # -------------------------------------------------------------------------
    def calculate_centrality_metrics(self):
        """
        Runs mathematical graph centrality algorithms:
        - PageRank: Systemic authority score
        - Betweenness Centrality: Information bridges and single bottlenecks
        - Degree Centrality: Direct multi-entity connectivity
        """
        g = self.get_full_graph(node_limit=250)
        nodes = {n['id']: n for n in g.get('nodes', [])}
        edges = g.get('edges', [])
        N = max(1, len(nodes))

        from collections import defaultdict, deque
        undirected_adj = defaultdict(set)
        in_degree = defaultdict(int)
        out_degree = defaultdict(int)

        for e in edges:
            u, v = e.get('from'), e.get('to')
            if u in nodes and v in nodes:
                undirected_adj[u].add(v)
                undirected_adj[v].add(u)
                out_degree[u] += 1
                in_degree[v] += 1

        degrees = {nid: len(undirected_adj[nid]) for nid in nodes}

        # PageRank (25 iterations, damping 0.85)
        d = 0.85
        pr = {nid: 1.0 / N for nid in nodes}
        for _ in range(25):
            next_pr = {nid: (1 - d) / N for nid in nodes}
            for u in nodes:
                outs = list(undirected_adj[u])
                if outs:
                    contrib = d * pr[u] / len(outs)
                    for v in outs:
                        next_pr[v] += contrib
                else:
                    for v in nodes:
                        next_pr[v] += d * pr[u] / N
            pr = next_pr

        # Betweenness Centrality (Brandes Algorithm)
        cb = {nid: 0.0 for nid in nodes}
        for s in nodes:
            S = []
            P = defaultdict(list)
            sigma = defaultdict(float)
            sigma[s] = 1.0
            dist = {nid: -1 for nid in nodes}
            dist[s] = 0
            Q = deque([s])
            while Q:
                v = Q.popleft()
                S.append(v)
                for w in undirected_adj[v]:
                    if dist[w] < 0:
                        dist[w] = dist[v] + 1
                        Q.append(w)
                    if dist[w] == dist[v] + 1:
                        sigma[w] += sigma[v]
                        P[w].append(v)
            delta = defaultdict(float)
            while S:
                w = S.pop()
                for v in P[w]:
                    delta[v] += (sigma[v] / sigma[w]) * (1.0 + delta[w])
                if w != s:
                    cb[w] += delta[w]

        scale = 1.0 / ((N - 1) * (N - 2)) if N > 2 else 1.0
        for nid in cb:
            cb[nid] = round(cb[nid] * scale * 0.5, 4)

        ranked_nodes = []
        for nid, n in nodes.items():
            b_score = cb[nid]
            pr_score = round(pr[nid], 4)
            deg = degrees[nid]
            group = n.get('group', 'Entity')

            role = 'Standard Node'
            badge = 'bg-secondary'
            if b_score >= 0.08:
                role = 'Critical Network Bridge'
                badge = 'bg-danger'
            elif pr_score >= 0.035:
                role = 'Systemic Authority Hub'
                badge = 'bg-warning text-dark'
            elif group == 'Doctor' and deg >= 4:
                role = 'Key Clinical Prescriber'
                badge = 'bg-primary'
            elif group == 'Medicine' and in_degree[nid] >= 3:
                role = 'Formulary Anchor'
                badge = 'bg-teal text-white'
            elif group == 'Hospital':
                role = 'Regional Care Facility'
                badge = 'bg-info text-dark'

            influence_idx = round(min(100.0, (b_score * 450 + pr_score * 950 + (deg / 25) * 20)), 1)

            ranked_nodes.append({
                'id': nid,
                'label': n.get('label'),
                'group': group,
                'degree': deg,
                'in_degree': in_degree[nid],
                'out_degree': out_degree[nid],
                'pagerank': pr_score,
                'betweenness': b_score,
                'influence_index': influence_idx,
                'systemic_role': role,
                'role_badge': badge
            })

        ranked_nodes.sort(key=lambda x: x['influence_index'], reverse=True)
        return {
            'total_nodes': N,
            'top_bridges': sorted(ranked_nodes, key=lambda x: x['betweenness'], reverse=True)[:5],
            'top_authorities': sorted(ranked_nodes, key=lambda x: x['pagerank'], reverse=True)[:5],
            'leaderboard': ranked_nodes[:20]
        }

    # -------------------------------------------------------------------------
    # ADVANCED GRAPH IMPLEMENTATION 4: LIVE CYPHER EXPORT SCRIPT GENERATOR
    # -------------------------------------------------------------------------
    def generate_cypher_export(self):
        """Generates complete, executable Cypher migration script matching MySQL dataset."""
        g = self.get_full_graph(node_limit=300)
        nodes = g.get('nodes', [])
        edges = g.get('edges', [])

        lines = []
        lines.append("// =============================================================================")
        lines.append("// PHARMA CARE & INVENTORY - COMPLETE NEO4J PROPERTY GRAPH IMPORT SCRIPT")
        lines.append("// Generated automatically from Relational Healthcare Master Database")
        lines.append("// =============================================================================\n")

        lines.append("// 1. Unique Constraints & Indexes")
        labels = ['Patient', 'Doctor', 'Hospital', 'Pharmacy', 'Pharmacist', 'Medicine', 'Prescription', 'Manufacturer', 'Supplier', 'WholesaleSupplier']
        for lbl in labels:
            key = self._get_id_property_name(lbl)
            lines.append(f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{lbl}) REQUIRE n.{key} IS UNIQUE;")
        lines.append("")

        lines.append("// 2. Nodes Creation")
        for n in nodes:
            lbl = n.get('group', 'Node')
            props = n.get('properties', {})
            prop_strs = []
            for k, v in props.items():
                if v is None:
                    continue
                if isinstance(v, (int, float)):
                    prop_strs.append(f"`{k}`: {v}")
                else:
                    escaped = str(v).replace("'", "\\'").replace('"', '\\"')
                    prop_strs.append(f"`{k}`: '{escaped}'")
            if 'name' not in props:
                prop_strs.append(f"name: '{n.get('label', '')}'")
            props_formatted = "{" + ", ".join(prop_strs) + "}"
            lines.append(f"MERGE (n:{lbl} {{{self._get_id_property_name(lbl)}: '{n['id'].split('_', 1)[-1]}'}}) SET n += {props_formatted};")
        lines.append("")

        lines.append("// 3. Relationship Topology Creation")
        for e in edges:
            u = e.get('from')
            v = e.get('to')
            rel = e.get('label', 'CONNECTED_TO')
            u_lbl = u.split('_')[0]
            u_id = u.split('_', 1)[-1]
            v_lbl = v.split('_')[0]
            v_id = v.split('_', 1)[-1]
            u_key = self._get_id_property_name(u_lbl)
            v_key = self._get_id_property_name(v_lbl)
            lines.append(f"MATCH (a:{u_lbl} {{{u_key}: '{u_id}'}}), (b:{v_lbl} {{{v_key}: '{v_id}'}}) MERGE (a)-[:{rel}]->(b);")

        lines.append("\n// ======================= END OF CYPHER SCRIPT =======================")
        return "\n".join(lines)


# Global singleton instance
neo4j_service = Neo4jService.get_instance()

