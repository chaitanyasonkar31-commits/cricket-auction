import os
import sys
sys.stderr.write("🚀 [BACKEND] PYTHON PROCESS STARTING UP...\n")
sys.stderr.flush()
import json
import time
import random
import string
import threading
import queue
import base64
import hashlib
import uuid
from urllib.parse import urlparse, parse_qs
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


# Global room state store and lock
rooms = {}
rooms_lock = threading.Lock()

# Cricket Player Presets
PRESETS = {
    "ipl_legends": [
        {"id": 1, "name": "Virat Kohli", "role": "Batsman", "rating": 96, "base_price": 20000000, "stats": "Runs: 7624, Avg: 38.7, SR: 130.7", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316605.png", "overseas": False},
        {"id": 2, "name": "MS Dhoni", "role": "Wicket-Keeper", "rating": 95, "base_price": 20000000, "stats": "Runs: 5243, Avg: 39.1, SR: 137.5, Catch/Stump: 192", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319900/319946.png", "overseas": False},
        {"id": 3, "name": "Jasprit Bumrah", "role": "Bowler", "rating": 98, "base_price": 20000000, "stats": "Wickets: 165, Econ: 7.30, Avg: 22.5", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316584.png", "overseas": False},
        {"id": 4, "name": "Rohit Sharma", "role": "Batsman", "rating": 94, "base_price": 20000000, "stats": "Runs: 6628, Avg: 29.7, SR: 131.2", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316581.png", "overseas": False},
        {"id": 5, "name": "Ravindra Jadeja", "role": "All-Rounder", "rating": 93, "base_price": 15000000, "stats": "Runs: 2958, SR: 129.5, Wickets: 160, Econ: 7.62", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316534.png", "overseas": False},
        {"id": 6, "name": "Hardik Pandya", "role": "All-Rounder", "rating": 92, "base_price": 15000000, "stats": "Runs: 2525, SR: 145.8, Wickets: 64, Econ: 8.75", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316587.png", "overseas": False},
        {"id": 7, "name": "Heinrich Klaasen", "role": "Wicket-Keeper", "rating": 94, "base_price": 15000000, "stats": "Runs: 980, Avg: 41.2, SR: 168.3", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319056.png", "overseas": True},
        {"id": 8, "name": "Rashid Khan", "role": "Bowler", "rating": 95, "base_price": 15000000, "stats": "Wickets: 148, Econ: 6.78, Avg: 20.8", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/313300/313398.png", "overseas": True},
        {"id": 9, "name": "Suryakumar Yadav", "role": "Batsman", "rating": 95, "base_price": 15000000, "stats": "Runs: 3594, Avg: 32.4, SR: 143.6", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316620.png", "overseas": False},
        {"id": 10, "name": "Travis Head", "role": "Batsman", "rating": 93, "base_price": 15000000, "stats": "Runs: 960, Avg: 36.8, SR: 172.5", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319001.png", "overseas": True},
        {"id": 11, "name": "Rishabh Pant", "role": "Wicket-Keeper", "rating": 91, "base_price": 15000000, "stats": "Runs: 3284, Avg: 35.3, SR: 148.9", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316612.png", "overseas": False},
        {"id": 12, "name": "Sunil Narine", "role": "All-Rounder", "rating": 94, "base_price": 15000000, "stats": "Runs: 1540, SR: 162.4, Wickets: 180, Econ: 6.64", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319030.png", "overseas": True},
        {"id": 13, "name": "Mitchell Starc", "role": "Bowler", "rating": 92, "base_price": 20000000, "stats": "Wickets: 95, Econ: 8.12, Avg: 24.6", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319052.png", "overseas": True},
        {"id": 14, "name": "Yuzvendra Chahal", "role": "Bowler", "rating": 90, "base_price": 10000000, "stats": "Wickets: 205, Econ: 7.84, Avg: 22.4", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316600/316618.png", "overseas": False},
        {"id": 15, "name": "Andre Russell", "role": "All-Rounder", "rating": 93, "base_price": 15000000, "stats": "Runs: 2484, SR: 174.0, Wickets: 115, Econ: 9.18", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319028.png", "overseas": True}
    ],
    "all_time_legends": [
        {"id": 101, "name": "Sachin Tendulkar", "role": "Batsman", "rating": 99, "base_price": 20000000, "stats": "Runs: 18426, Avg: 44.8, SR: 86.2 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/316500/316599.png", "overseas": False},
        {"id": 102, "name": "Viv Richards", "role": "Batsman", "rating": 98, "base_price": 20000000, "stats": "Runs: 6721, Avg: 47.0, SR: 90.2 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319043.png", "overseas": True},
        {"id": 103, "name": "Shane Warne", "role": "Bowler", "rating": 99, "base_price": 20000000, "stats": "Wickets: 708 (Test), Wickets: 293 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319045.png", "overseas": True},
        {"id": 104, "name": "Wasim Akram", "role": "Bowler", "rating": 98, "base_price": 20000000, "stats": "Wickets: 502 (ODI), Econ: 3.90, Wickets: 414 (Test)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319048.png", "overseas": True},
        {"id": 105, "name": "Jacques Kallis", "role": "All-Rounder", "rating": 98, "base_price": 20000000, "stats": "Runs: 11579 (ODI), Wickets: 273 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319050.png", "overseas": True},
        {"id": 106, "name": "Adam Gilchrist", "role": "Wicket-Keeper", "rating": 97, "base_price": 20000000, "stats": "Runs: 9619, Avg: 35.8, SR: 96.9, Dismissals: 472", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319054.png", "overseas": True},
        {"id": 107, "name": "AB de Villiers", "role": "Batsman", "rating": 98, "base_price": 20000000, "stats": "Runs: 9577, Avg: 53.5, SR: 101.2, Fast ODI 100 (31b)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319055.png", "overseas": True},
        {"id": 108, "name": "Glenn McGrath", "role": "Bowler", "rating": 97, "base_price": 15000000, "stats": "Wickets: 563 (Test), Econ: 2.49, Wickets: 381 (ODI)", "img": "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_320,q_50/lsci/db/PICTURES/CMS/319000/319058.png", "overseas": True}
    ]
}

# Load players database from public/players.json if it exists
players_json_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'players.json')
if os.path.exists(players_json_path):
    try:
        with open(players_json_path, 'r', encoding='utf-8') as f:
            loaded_presets = json.load(f)
            PRESETS.update(loaded_presets)
            print(f"Loaded players dynamically. Pools: {list(PRESETS.keys())}, Full Pool contains {len(PRESETS.get('full_pool', []))} players.")
    except Exception as e:
        print(f"Error loading players.json: {e}")

# User Account Registry Database
# Make users database persistent on local Windows, fallback to workspace for Render/Linux hosting
if os.name == 'nt':
    persistent_dir = os.path.join(os.environ.get('USERPROFILE', 'C:\\Users\\Chaitanya'), '.cricket_auction')
else:
    persistent_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

if not os.path.exists(persistent_dir):
    try:
        os.makedirs(persistent_dir)
    except Exception as e:
        sys.stderr.write(f"⚠️ Error creating persistent directory {persistent_dir}: {e}. Falling back to /tmp/.cricket_auction\n")
        sys.stderr.flush()
        persistent_dir = "/tmp/.cricket_auction"
        if not os.path.exists(persistent_dir):
            try:
                os.makedirs(persistent_dir)
            except Exception as ex:
                sys.stderr.write(f"❌ Failed to create /tmp fallback directory: {ex}\n")
                sys.stderr.flush()

def get_serializable_room(room):
    """Deep copies room state except clients list which has Queue objects."""
    serializable = {}
    for k, v in room.items():
        if k != "clients":
            serializable[k] = v
    return serializable

# Database class supporting local SQLite and cloud PostgreSQL
class AuctionDB:
    def __init__(self):
        self.db_url = os.environ.get('DATABASE_URL')
        self.is_postgres = False
        
        if self.db_url and (self.db_url.startswith('postgres://') or self.db_url.startswith('postgresql://')):
            try:
                import psycopg2
                self.is_postgres = True
                sys.stderr.write("🔌 Connecting to cloud PostgreSQL database...\n")
                sys.stderr.flush()
            except ImportError:
                sys.stderr.write("⚠️ Warning: DATABASE_URL is set but 'psycopg2' is not installed. Falling back to local SQLite.\n")
                sys.stderr.flush()
                
        if not self.is_postgres:
            self.sqlite_path = os.path.join(persistent_dir, 'auction.db')
            sys.stderr.write(f"🔌 Connecting to local SQLite database at: {self.sqlite_path}\n")
            sys.stderr.flush()
            
        self.init_db()
        self.migrate_json_data()

    def migrate_json_data(self):
        # 1. Migrate users.json
        users_json = os.path.join(persistent_dir, 'users.json')
        if os.path.exists(users_json):
            try:
                print("Migrating users.json to SQL database...")
                with open(users_json, 'r', encoding='utf-8') as f:
                    old_users = json.load(f)
                
                conn = self.get_connection()
                cursor = conn.cursor()
                migrated = 0
                for username, info in old_users.items():
                    password_hash = info.get("password_hash")
                    salt = info.get("salt")
                    if password_hash and salt:
                        if self.is_postgres:
                            cursor.execute(
                                "INSERT INTO users (username, password_hash, salt) VALUES (%s, %s, %s) ON CONFLICT (username) DO NOTHING",
                                (username, password_hash, salt)
                            )
                        else:
                            cursor.execute(
                                "INSERT OR IGNORE INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
                                (username, password_hash, salt)
                            )
                        migrated += 1
                conn.commit()
                conn.close()
                print(f"Migrated {migrated} users to database.")
                os.rename(users_json, users_json + ".bak")
            except Exception as e:
                print(f"Error migrating users.json: {e}")

        # 2. Migrate rooms/*.json and *.json.bak
        rooms_dir = os.path.join(persistent_dir, 'rooms')
        if os.path.exists(rooms_dir):
            try:
                files = os.listdir(rooms_dir)
                room_files = [f for f in files if f.endswith('.json') or f.endswith('.json.bak')]
                if room_files:
                    print(f"Migrating {len(room_files)} room JSON files to SQL database...")
                    existing_rooms = self.load_rooms()
                    for file in room_files:
                        room_code = file[:4].upper()
                        if room_code in existing_rooms:
                            if file.endswith('.json'):
                                try:
                                    os.rename(os.path.join(rooms_dir, file), os.path.join(rooms_dir, room_code + '.json.bak'))
                                except Exception:
                                    pass
                            continue
                        
                        room_file = os.path.join(rooms_dir, file)
                        try:
                            with open(room_file, 'r', encoding='utf-8') as f:
                                room_data = json.load(f)
                            self.save_room(room_code, room_data)
                            if file.endswith('.json'):
                                os.rename(room_file, room_file + ".bak")
                        except Exception as ex:
                            print(f"Error migrating room file {file}: {ex}")
                    print("Rooms migration complete.")
            except Exception as e:
                print(f"Error migrating room files: {e}")

    def get_connection(self):
        if self.is_postgres:
            try:
                import psycopg2
                url = self.db_url
                if url.startswith('postgres://'):
                    url = url.replace('postgres://', 'postgresql://', 1)
                return psycopg2.connect(url)
            except Exception as e:
                sys.stderr.write(f"❌ PostgreSQL connection failed: {e}. Falling back to SQLite.\n")
                sys.stderr.flush()
                self.is_postgres = False
        
        return sqlite3.connect(self.sqlite_path)

    def init_db(self):
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            if self.is_postgres:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        username VARCHAR(255) PRIMARY KEY,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS rooms (
                        room_code VARCHAR(10) PRIMARY KEY,
                        host_username VARCHAR(255) NOT NULL,
                        created_at VARCHAR(50) NOT NULL,
                        status VARCHAR(50) NOT NULL,
                        state_json TEXT NOT NULL
                    );
                """)
            else:
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS users (
                        username TEXT PRIMARY KEY,
                        password_hash TEXT NOT NULL,
                        salt TEXT NOT NULL
                    );
                """)
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS rooms (
                        room_code TEXT PRIMARY KEY,
                        host_username TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        status TEXT NOT NULL,
                        state_json TEXT NOT NULL
                    );
                """)
            conn.commit()
            conn.close()
        except Exception as e:
            sys.stderr.write(f"❌ Database initialization error: {e}\n")
            sys.stderr.flush()

    def load_users(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        users_dict = {}
        try:
            cursor.execute("SELECT username, password_hash, salt FROM users")
            for row in cursor.fetchall():
                users_dict[row[0]] = {
                    "password_hash": row[1],
                    "salt": row[2]
                }
        except Exception as e:
            print(f"Error loading users from database: {e}")
        finally:
            conn.close()
        return users_dict

    def save_user(self, username, password_hash, salt):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            if self.is_postgres:
                cursor.execute(
                    "INSERT INTO users (username, password_hash, salt) VALUES (%s, %s, %s) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, salt = EXCLUDED.salt",
                    (username, password_hash, salt)
                )
            else:
                cursor.execute(
                    "INSERT OR REPLACE INTO users (username, password_hash, salt) VALUES (?, ?, ?)",
                    (username, password_hash, salt)
                )
            conn.commit()
        except Exception as e:
            print(f"Error saving user {username} to database: {e}")
        finally:
            conn.close()

    def load_rooms(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        rooms_dict = {}
        try:
            cursor.execute("SELECT room_code, state_json FROM rooms")
            for row in cursor.fetchall():
                room_code = row[0].upper()
                try:
                    room_data = json.loads(row[1])
                    room_data["clients"] = []
                    room_data["bot_delay"] = 0
                    room_data["timer_active"] = False
                    if "season" not in room_data:
                        room_data["season"] = 1
                    if "standings" not in room_data:
                        room_data["standings"] = {}
                    if "trades" not in room_data:
                        room_data["trades"] = []
                    if "retentions" not in room_data:
                        room_data["retentions"] = {}
                    if "retention_locked" not in room_data:
                        room_data["retention_locked"] = {}
                    if "trade_window_open" not in room_data:
                        room_data["trade_window_open"] = False
                    rooms_dict[room_code] = room_data
                except Exception as ex:
                    print(f"Error parsing JSON for room {room_code}: {ex}")
        except Exception as e:
            print(f"Error loading rooms from database: {e}")
        finally:
            conn.close()
        return rooms_dict

    def save_room(self, room_code, room):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            serializable = get_serializable_room(room)
            state_json = json.dumps(serializable)
            host_username = room.get("host_username", "")
            created_at = room.get("created_at", "")
            status = room.get("status", "lobby")
            
            if self.is_postgres:
                cursor.execute(
                    "INSERT INTO rooms (room_code, host_username, created_at, status, state_json) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (room_code) DO UPDATE SET status = EXCLUDED.status, state_json = EXCLUDED.state_json",
                    (room_code, host_username, created_at, status, state_json)
                )
            else:
                cursor.execute(
                    "INSERT OR REPLACE INTO rooms (room_code, host_username, created_at, status, state_json) VALUES (?, ?, ?, ?, ?)",
                    (room_code, host_username, created_at, status, state_json)
                )
            conn.commit()
        except Exception as e:
            print(f"Error saving room {room_code} to database: {e}")
        finally:
            conn.close()

    def delete_room(self, room_code):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            if self.is_postgres:
                cursor.execute("DELETE FROM rooms WHERE room_code = %s", (room_code,))
            else:
                cursor.execute("DELETE FROM rooms WHERE room_code = ?", (room_code,))
            conn.commit()
        except Exception as e:
            print(f"Error deleting room {room_code} from database: {e}")
        finally:
            conn.close()

db = AuctionDB()
users = db.load_users()
users_lock = threading.Lock()
print(f"Loaded {len(users)} registered user accounts from database.")

# Session Management (Token -> Username)
sessions = {}
sessions_lock = threading.Lock()

# Background Database Save Worker to serialize SQLite writes asynchronously
db_save_queue = queue.Queue()

def db_save_worker():
    while True:
        try:
            item = db_save_queue.get()
            if item is None:
                break
            room_code, state_json, host_username, created_at, status = item
            
            conn = db.get_connection()
            cursor = conn.cursor()
            try:
                if db.is_postgres:
                    cursor.execute(
                        "INSERT INTO rooms (room_code, host_username, created_at, status, state_json) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (room_code) DO UPDATE SET status = EXCLUDED.status, state_json = EXCLUDED.state_json",
                        (room_code, host_username, created_at, status, state_json)
                    )
                else:
                    cursor.execute(
                        "INSERT OR REPLACE INTO rooms (room_code, host_username, created_at, status, state_json) VALUES (?, ?, ?, ?, ?)",
                        (room_code, host_username, created_at, status, state_json)
                    )
                conn.commit()
            except Exception as e:
                print(f"Error in background db save for room {room_code}: {e}")
            finally:
                conn.close()
                db_save_queue.task_done()
        except Exception as ex:
            print(f"Error in db_save_worker: {ex}")

# Start the background SQLite writer thread
save_thread = threading.Thread(target=db_save_worker, daemon=True)
save_thread.start()

def hash_password(password, salt=None):
    if salt is None:
        salt = os.urandom(16).hex()
    hashed = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000).hex()
    return hashed, salt

def get_user_from_token(token):
    if not token:
        return None
    if token.startswith("guest_"):
        return "Guest_" + token[6:12]
    with sessions_lock:
        return sessions.get(token)

def create_session(username):
    token = "auth_" + uuid.uuid4().hex
    with sessions_lock:
        # Invalidate any other active sessions for this user to ensure 1 active ID/session at any time
        for t, u in list(sessions.items()):
            if u == username:
                del sessions[t]
        sessions[token] = username
    return token

def format_currency_python(val):
    if val >= 10000000:
        return f"{val / 10000000:.2f} Cr"
    elif val >= 100000:
        return f"{val / 100000:.2f} L"
    return f"{val:,}"

def save_room_to_disk(room_code):
    if room_code not in rooms:
        return
    room = rooms[room_code]
    serializable = get_serializable_room(room)
    state_json = json.dumps(serializable)
    host_username = room.get("host_username", "")
    created_at = room.get("created_at", "")
    status = room.get("status", "lobby")
    db_save_queue.put((room_code, state_json, host_username, created_at, status))

def load_all_rooms():
    global rooms
    rooms = db.load_rooms()
    print(f"Loaded {len(rooms)} persistent auction rooms from database.")

load_all_rooms()

def broadcast(room_code, event_type, data):
    """Pushes events to all client queues in a specific room."""
    if room_code not in rooms:
        return
    room = rooms[room_code]
    
    # Pre-serialize to JSON once to avoid redundant string serialization in each client thread
    data_json = json.dumps(data)
    payload = {
        "type": event_type,
        "data_json": data_json,
        "timestamp": time.time()
    }
    
    to_remove = []
    for client_id, q in room["clients"]:
        try:
            q.put(payload)
        except Exception:
            to_remove.append((client_id, q))
            
    for client in to_remove:
        if client in room["clients"]:
            room["clients"].remove(client)

def sell_current_player(room_code):
    room = rooms[room_code]
    idx = room["current_player_index"]
    if idx < 0 or idx >= len(room["players"]):
        return
        
    room["last_completed_player_index"] = idx
    player = room["players"][idx]
    bidder = room["current_bidder"]
    price = room["current_bid"]
    
    player["status"] = "sold"
    player["bought_by"] = bidder
    player["price"] = price
    
    # Deduct budget
    if bidder in room["teams"]:
        room["teams"][bidder]["budget"] -= price
        room["teams"][bidder]["players"].append({
            "id": player["id"],
            "name": player["name"],
            "role": player["role"],
            "price": price,
            "rating": player["rating"],
            "overseas": player.get("overseas", False)
        })
        
        role = player["role"]
        if role in room["teams"][bidder]["slots"]:
            room["teams"][bidder]["slots"][role] += 1
            
    log_msg = f"🔨 SOLD: {player['name']} bought by {bidder} for {format_currency_python(price)}!"
    room["logs"].append(log_msg)
    
    room["status"] = "sold_pause"
    room["timer_active"] = False
    if room["settings"].get("bot_auctioneer"):
        room["bot_delay"] = 3
    
    save_room_to_disk(room_code)
    broadcast(room_code, "player_sold", {
        "player": player,
        "bidder": bidder,
        "price": price,
        "log": log_msg,
        "room": get_serializable_room(room)
    })

def unsold_current_player(room_code):
    room = rooms[room_code]
    idx = room["current_player_index"]
    if idx < 0 or idx >= len(room["players"]):
        return
        
    room["last_completed_player_index"] = idx
    player = room["players"][idx]
    player["status"] = "passed"
    
    log_msg = f"❌ UNSOLD: {player['name']} went unsold at base price of {format_currency_python(player['base_price'])}."
    room["logs"].append(log_msg)
    
    room["status"] = "unsold_pause"
    room["timer_active"] = False
    if room["settings"].get("bot_auctioneer"):
        room["bot_delay"] = 3
    
    save_room_to_disk(room_code)
    broadcast(room_code, "player_unsold", {
        "player": player,
        "log": log_msg,
        "room": get_serializable_room(room)
    })

def advance_to_next_player(room_code, role_filter="All", player_id=None):
    room = rooms[room_code]
    idx = room["current_player_index"]
    next_unsold = -1
    
    # Helper to check if player matches the active filter (role or unsold status)
    def matches_filter(p):
        if p.get("bought_by") is not None or p.get("status") == "sold":
            return False
        if role_filter == "Unsold":
            return p.get("status") == "passed"
        else:
            if p.get("status", "unsold") != "unsold":
                return False
            return role_filter == "All" or not role_filter or p.get("role") == role_filter

    # If a specific player is requested by the host
    if player_id is not None:
        try:
            player_id_int = int(player_id)
            for i, p in enumerate(room["players"]):
                if p["id"] == player_id_int:
                    # Verify player is unsold and not bought
                    if p.get("status", "unsold") != "sold" and p.get("bought_by") is None:
                        next_unsold = i
                        break
        except (ValueError, TypeError):
            pass
            
    # Fallback to sequential/filtered search if no specific player was found or requested
    if next_unsold == -1:
        # If starting for the first time
        if idx == -1:
            # Find first unsold player matching role_filter
            for i, p in enumerate(room["players"]):
                if matches_filter(p):
                    next_unsold = i
                    break
            action_msg = "🎬 Auction started!"
        else:
            # Search starting after current index
            for i in range(idx + 1, len(room["players"])):
                p = room["players"][i]
                if matches_filter(p):
                    next_unsold = i
                    break
                        
            # Wrap around if not found
            if next_unsold == -1:
                for i in range(0, idx + 1):
                    p = room["players"][i]
                    if matches_filter(p):
                        next_unsold = i
                        break
            action_msg = "🏏 Next up:"
    else:
        action_msg = "🎯 Host introduced:"

    if next_unsold == -1:
        if role_filter and role_filter != "All":
            return False, f"No unsold players left in category: {role_filter}!"
        else:
            room["status"] = "finished"
            finish_msg = "🏆 Cricket Player Auction completed! All players auctioned."
            room["logs"].append(finish_msg)
            save_room_to_disk(room_code)
            return True, finish_msg
    else:
        room["current_player_index"] = next_unsold
        room["status"] = "active"
        room["current_bid"] = 0
        room["current_bidder"] = None
        room["timer"] = room["settings"]["timer_duration"]
        room["timer_active"] = True
        
        player = room["players"][next_unsold]
        player_name = player["name"]
        msg = f"{action_msg} {player_name} (Base: {format_currency_python(player['base_price'])})"
        room["logs"].append(msg)
        save_room_to_disk(room_code)
        return True, msg

# Global room countdown timer background thread
def timer_worker():
    while True:
        time.sleep(1)
        with rooms_lock:
            for room_code, room in list(rooms.items()):
                if room["status"] == "active" and room["timer_active"]:
                    if room["timer"] > 0:
                        room["timer"] -= 1
                        # Broadcast timer tick
                        broadcast(room_code, "timer", {
                            "timer": room["timer"],
                            "timer_active": room["timer_active"]
                        })
                        if room["timer"] == 0:
                            if room["settings"].get("bot_auctioneer"):
                                if room["current_bidder"] is None:
                                    unsold_current_player(room_code)
                                else:
                                    sell_current_player(room_code)
                            else:
                                room["logs"].append("⏰ Timer reached 0! Awaiting Host action...")
                                broadcast(room_code, "state_update", get_serializable_room(room))
                elif (room["status"] in ("sold_pause", "unsold_pause")) and room["settings"].get("bot_auctioneer"):
                    if "bot_delay" not in room:
                        room["bot_delay"] = 3
                    if room["bot_delay"] > 0:
                        room["bot_delay"] -= 1
                        if room["bot_delay"] == 0:
                            role_filter = room.get("current_role_filter", "All")
                            advance_to_next_player(room_code, role_filter)
                            broadcast(room_code, "state_update", get_serializable_room(room))

# Start background timer thread
timer_thread = threading.Thread(target=timer_worker, daemon=True)
timer_thread.start()

class AuctionHTTPHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add standard headers
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        url_parsed = urlparse(self.path)
        path = url_parsed.path
        
        if path == '/api/presets':
            self.send_json_response(200, PRESETS)
            return
            
        if path == '/api/config':
            self.send_json_response(200, {})
            return
            
        # Real-time event stream via Server-Sent Events (SSE)
        if path == '/events':
            query = parse_qs(url_parsed.query)
            room_code = query.get('room', [''])[0].upper()
            client_id = query.get('clientId', [''])[0]
            
            if not room_code or room_code not in rooms:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b"Room not found")
                return
                
            # Prepare streaming headers
            self.send_response(200)
            self.send_header('Content-Type', 'text/event-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('Connection', 'keep-alive')
            self.send_header('X-Accel-Buffering', 'no')
            self.end_headers()
            
            # Create thread-safe queue for this connection
            q = queue.Queue()
            with rooms_lock:
                room = rooms[room_code]
                # If client_id already exists, replace it to clean up old connections
                room["clients"] = [c for c in room["clients"] if c[0] != client_id]
                room["clients"].append((client_id, q))
                
                # Immediately push initial room status to this client
                init_payload = {
                    "type": "init",
                    "data_json": json.dumps(get_serializable_room(room)),
                    "timestamp": time.time()
                }
                q.put(init_payload)
            
            # Enable aggressive TCP keepalive on this persistent socket to detect client drops quickly
            import socket
            try:
                self.connection.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
                # Platform-specific TCP keep-alive settings (10 seconds idle, 5 seconds interval, 3 probes)
                if hasattr(socket, 'TCP_KEEPIDLE'):
                    self.connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, 10)
                if hasattr(socket, 'TCP_KEEPINTVL'):
                    self.connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 5)
                if hasattr(socket, 'TCP_KEEPCNT'):
                    self.connection.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)
            except Exception:
                pass
            
            # Streaming loop
            try:
                while True:
                    # Thread Leak Prevention: Check if this connection's queue is still registered.
                    # If it has been replaced (e.g. page refresh) or room was deleted, exit the thread.
                    with rooms_lock:
                        if room_code not in rooms:
                            break
                        active_queues = [c[1] for c in rooms[room_code]["clients"]]
                        if q not in active_queues:
                            break
                            
                    try:
                        # Wait for a new event with 5s timeout to send heartbeat keep-alive
                        msg = q.get(timeout=5.0)
                        event_str = f"event: {msg['type']}\ndata: {msg['data_json']}\n\n"
                        self.wfile.write(event_str.encode('utf-8'))
                        self.wfile.flush()
                    except queue.Empty:
                        # Keep connection alive with an SSE comment line
                        self.wfile.write(b": keep-alive\n\n")
                        self.wfile.flush()
            except (ConnectionResetError, BrokenPipeError, Exception) as e:
                # Connection was closed by client
                pass
            finally:
                # Remove client queue
                with rooms_lock:
                    if room_code in rooms:
                        rooms[room_code]["clients"] = [c for c in rooms[room_code]["clients"] if c[1] != q]
            return
            
        # Fall back to serving static files from public directory
        super().do_GET()

    def do_POST(self):
        url_parsed = urlparse(self.path)
        path = url_parsed.path
        
        # Check if route starts with API prefix
        if path.startswith('/api/'):
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8')) if post_data else {}
            except Exception:
                self.send_json_response(400, {"error": "Invalid JSON"})
                return
                
            if path == '/api/create':
                self.handle_create(data)
            elif path == '/api/join':
                self.handle_join(data)
            elif path == '/api/bid':
                self.handle_bid(data)
            elif path == '/api/control':
                self.handle_control(data)
            elif path == '/api/trade':
                self.handle_trade(data)
            elif path == '/api/presets':
                self.send_json_response(200, PRESETS)
            elif path == '/api/auth/register':
                self.handle_register(data)
            elif path == '/api/auth/login':
                self.handle_login(data)
            elif path == '/api/chat':
                self.handle_chat(data)
            elif path == '/api/history':
                self.handle_history(data)
            elif path == '/api/room':
                self.handle_get_room(data)
            elif path == '/api/delete_room':
                self.handle_delete_room(data)
            else:
                self.send_json_response(404, {"error": "Not Found"})
        else:
            self.send_json_response(404, {"error": "Not Found"})

    def send_json_response(self, status, payload):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def handle_register(self, data):
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            self.send_json_response(400, {"error": "Username and password are required"})
            return
            
        if len(username) < 3 or len(username) > 20:
            self.send_json_response(400, {"error": "Username must be between 3 and 20 characters"})
            return
            
        if not all(c.isalnum() or c in '_-' for c in username):
            self.send_json_response(400, {"error": "Username can only contain alphanumeric characters, dashes, and underscores"})
            return

        with users_lock:
            if username in users:
                self.send_json_response(400, {"error": "Username is already taken"})
                return
                
            hashed, salt = hash_password(password)
            users[username] = {
                "password_hash": hashed,
                "salt": salt
            }
            db.save_user(username, hashed, salt)
            
        token = create_session(username)
        self.send_json_response(200, {
            "success": True, 
            "auth_token": token,
            "username": username
        })

    def handle_login(self, data):
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            self.send_json_response(400, {"error": "Username and password are required"})
            return
            
        with users_lock:
            if username not in users:
                self.send_json_response(400, {"error": "Invalid username or password"})
                return
                
            user_data = users[username]
            hashed, _ = hash_password(password, user_data["salt"])
            if hashed != user_data["password_hash"]:
                self.send_json_response(400, {"error": "Invalid username or password"})
                return
                
        token = create_session(username)
        self.send_json_response(200, {
            "success": True,
            "auth_token": token,
            "username": username
        })

    def handle_create(self, data):
        auth_token = data.get('auth_token')
        username = get_user_from_token(auth_token)
        if not username:
            self.send_json_response(401, {"error": "Authentication is required to host an auction."})
            return
            
        host_name = data.get('host_name', 'Host')
        auction_name = data.get('auction_name', 'Cricket Auction')
        settings = data.get('settings', {})
        custom_players = data.get('players', [])
        preset_key = data.get('preset', 'ipl_legends')
        
        # Resolve players (preset or custom)
        players = []
        if preset_key in PRESETS and not custom_players:
            players = json.loads(json.dumps(PRESETS[preset_key])) # deep copy
        else:
            # Clean up and load custom players
            players = custom_players
            
        if not players:
            self.send_json_response(400, {"error": "No players specified"})
            return
            
        # Randomize draft order by shuffling the players pool
        random.shuffle(players)
            
        budget = int(settings.get('budget', 1500000000))
        min_increment = int(settings.get('min_increment', 500000))
        timer_duration = int(settings.get('timer_duration', 15))
        overseas_limit = int(settings.get('overseas_limit', 999))
        bot_auctioneer = bool(settings.get('bot_auctioneer', False))
        
        # Generate clean Room Code
        with rooms_lock:
            room_code = ''
            for _ in range(10): # try 10 times to get unique
                code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
                # replace visually confusing letters/numbers
                code = code.replace('O', 'K').replace('0', '7').replace('I', 'X').replace('1', '9')
                if code not in rooms:
                    room_code = code
                    break
            if not room_code:
                room_code = "ROOM" + str(random.randint(10, 99))
                
            host_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=12))
            
            rooms[room_code] = {
                "host_username": username,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "auction_name": auction_name,
                "host_name": host_name,
                "host_id": host_id,
                "settings": {
                    "budget": budget,
                    "min_increment": min_increment,
                    "timer_duration": timer_duration,
                    "overseas_limit": overseas_limit,
                    "bot_auctioneer": bot_auctioneer
                },
                "players": players,
                "current_player_index": -1,
                "current_bid": 0,
                "current_bidder": None,
                "timer": timer_duration,
                "timer_active": False,
                "teams": {},
                "logs": [f"🏏 Room {room_code} created by {host_name}.", "🏏 Waiting for managers to join..."],
                "clients": [],
                "status": "lobby",
                "current_role_filter": "All",
                "bot_delay": 0,
                "season": 1,
                "standings": {},
                "trades": [],
                "retentions": {},
                "retention_locked": {},
                "trade_window_open": False,
                "last_completed_player_index": None
            }
            save_room_to_disk(room_code)
            
        self.send_json_response(200, {
            "room_code": room_code,
            "host_id": host_id,
            "room_state": get_serializable_room(rooms[room_code])
        })

    def handle_join(self, data):
        room_code = data.get('room_code', '').upper()
        team_name = data.get('team_name', '').strip()
        manager_name = data.get('manager_name', '').strip()
        auth_token = data.get('auth_token')
        
        if not room_code or room_code not in rooms:
            self.send_json_response(404, {"error": "Room not found"})
            return
            
        if not team_name or not manager_name:
            self.send_json_response(400, {"error": "Team and Manager name are required"})
            return
            
        username = get_user_from_token(auth_token)
        if not username:
            self.send_json_response(401, {"error": "Authentication is required to join rooms."})
            return
            
        with rooms_lock:
            room = rooms[room_code]
            
            # Enforce unique Username per room code (prevent one user from creating multiple franchises)
            for existing_team_name, existing_team in room["teams"].items():
                if existing_team.get("username") == username:
                    if existing_team_name != team_name:
                        self.send_json_response(400, {
                            "error": f"You have already joined this room as team '{existing_team_name}'."
                        })
                        return
            
            # Allow reconnecting if details and Username match
            if team_name in room["teams"]:
                if room["teams"][team_name].get("username") != username:
                    self.send_json_response(400, {"error": "Team Name is already taken!"})
                    return
            else:
                # Limit room to 12 users
                if len(room["teams"]) >= 12:
                    self.send_json_response(400, {"error": "Room is full! Maximum 12 teams allowed."})
                    return
                # Setup new team structure
                room["teams"][team_name] = {
                    "username": username,
                    "manager": manager_name,
                    "budget": room["settings"]["budget"],
                    "players": [],
                    "slots": {"Batsman": 0, "Bowler": 0, "All-Rounder": 0, "Wicket-Keeper": 0}
                }
                join_msg = f"👋 {team_name} (Manager: {manager_name}) entered the lobby!"
                room["logs"].append(join_msg)
                
            save_room_to_disk(room_code)
            broadcast(room_code, "state_update", get_serializable_room(room))
            
        self.send_json_response(200, {
            "room_code": room_code,
            "team_name": team_name,
            "manager_name": manager_name,
            "room_state": get_serializable_room(room)
        })

    def handle_bid(self, data):
        room_code = data.get('room_code', '').upper()
        team_name = data.get('team_name', '')
        amount = int(data.get('amount', 0))
        
        if room_code not in rooms:
            self.send_json_response(404, {"error": "Room not found"})
            return
            
        with rooms_lock:
            room = rooms[room_code]
            
            # Validations
            if room["status"] != "active" or not room["timer_active"]:
                self.send_json_response(400, {"error": "Bidding is currently closed."})
                return
                
            idx = room["current_player_index"]
            if idx < 0 or idx >= len(room["players"]):
                self.send_json_response(400, {"error": "No active player for bidding."})
                return
                
            player = room["players"][idx]
            
            if team_name not in room["teams"]:
                self.send_json_response(403, {"error": "Team not registered in this room."})
                return
                
            team = room["teams"][team_name]
            
            # Check maximum squad size
            squad_limit = room["settings"].get("squad_limit", 16)
            if len(team["players"]) >= squad_limit:
                self.send_json_response(400, {"error": f"Squad is full! Maximum {squad_limit} players allowed per team."})
                return
                
            # Calculate minimum required bid amount
            if room["current_bid"] == 0:
                min_req = player["base_price"]
            else:
                min_req = room["current_bid"] + room["settings"]["min_increment"]
                
            # If concurrent bids were sent, auto-adjust to the new minimum increment
            if amount < min_req:
                amount = min_req

            # Check budget with the final adjusted amount
            if amount > team["budget"]:
                self.send_json_response(400, {"error": f"Insufficient budget! Your budget is {format_currency_python(team['budget'])}."})
                return
                
            if team_name == room["current_bidder"]:
                self.send_json_response(400, {"error": "You already hold the highest bid!"})
                return
                
            # Place bid
            room["current_bid"] = amount
            room["current_bidder"] = team_name
            # Reset countdown timer on new bids (adds excitement & fair play)
            room["timer"] = room["settings"]["timer_duration"]
            
            bid_msg = f"⚡ {team_name} bid {format_currency_python(amount)}"
            room["logs"].append(bid_msg)
            
            # Save and Broadcast updates
            save_room_to_disk(room_code)
            broadcast(room_code, "bid_placed", {
                "bidder": team_name,
                "amount": amount,
                "timer": room["timer"],
                "log": bid_msg,
                "room": get_serializable_room(room)
            })
            
        self.send_json_response(200, {"success": True})

    def handle_control(self, data):
        room_code = data.get('room_code', '').upper()
        host_id = data.get('host_id', '')
        action = data.get('action', '')
        
        if room_code not in rooms:
            self.send_json_response(404, {"error": "Room not found"})
            return
            
        with rooms_lock:
            room = rooms[room_code]
            if room["host_id"] != host_id:
                self.send_json_response(403, {"error": "Unauthorized host controls."})
                return
                
            # Host logic actions
            role_filter = data.get('role_filter') # e.g. "Batsman", "Bowler", "All-Rounder", "Wicket-Keeper" or "All"
            if role_filter:
                room["current_role_filter"] = role_filter
            else:
                role_filter = room.get("current_role_filter", "All")
                
            if action in ("start", "next"):
                player_id = data.get('player_id')
                success, msg = advance_to_next_player(room_code, role_filter, player_id=player_id)
                if not success:
                    self.send_json_response(400, {"error": msg})
                    return
            elif action == "open_dashboard":
                room["status"] = "active"
                room["current_player_index"] = -1
                room["timer_active"] = False
                room["logs"].append("🎬 Draft session started! Host is setting up the first player...")
            elif action == "pause":
                room["timer_active"] = False
                room["logs"].append("⏸️ Auction timer paused by Host.")
                
            elif action == "resume":
                room["timer_active"] = True
                room["logs"].append("▶️ Auction timer resumed by Host.")
                
            elif action == "sell":
                if room["status"] == "active" and room["current_bid"] > 0 and room["current_bidder"]:
                    sell_current_player(room_code)
                else:
                    self.send_json_response(400, {"error": "Cannot sell. No bids placed yet."})
                    return
                    
            elif action == "unsold":
                if room["status"] == "active":
                    unsold_current_player(room_code)
                else:
                    self.send_json_response(400, {"error": "No active player to pass."})
                    return
                    
            elif action == "reset_player":
                idx = room["current_player_index"]
                if idx >= 0:
                    player = room["players"][idx]
                    
                    # If previously sold, reverse details
                    prev_bidder = player.get("bought_by")
                    prev_price = player.get("price", 0)
                    if prev_bidder and prev_bidder in room["teams"]:
                        # Give refund
                        room["teams"][prev_bidder]["budget"] += prev_price
                        # Remove player from roster list
                        room["teams"][prev_bidder]["players"] = [p for p in room["teams"][prev_bidder]["players"] if p["id"] != player["id"]]
                        # Decrement category slot
                        role = player["role"]
                        if role in room["teams"][prev_bidder]["slots"] and room["teams"][prev_bidder]["slots"][role] > 0:
                            room["teams"][prev_bidder]["slots"][role] -= 1
                            
                    player["status"] = "unsold"
                    player["bought_by"] = None
                    player["price"] = 0
                    
                    room["status"] = "active"
                    room["current_bid"] = 0
                    room["current_bidder"] = None
                    room["timer"] = room["settings"]["timer_duration"]
                    room["timer_active"] = True
                    
                    reset_msg = f"🔄 Bidding restarted for {player['name']}."
                    room["logs"].append(reset_msg)
                    
            elif action == "kick":
                team_to_kick = data.get('team_name', '').strip()
                if team_to_kick in room["teams"]:
                    del room["teams"][team_to_kick]
                    kick_msg = f"🚫 Team '{team_to_kick}' was kicked by the Host."
                    room["logs"].append(kick_msg)
                    
                    # If this team holds the highest bid, reset bid
                    if room["current_bidder"] == team_to_kick:
                        room["current_bid"] = 0
                        room["current_bidder"] = None
                        room["timer"] = room["settings"]["timer_duration"]
                        room["logs"].append(f"🔄 Bidding reset because highest bidder '{team_to_kick}' was kicked.")
                else:
                    self.send_json_response(400, {"error": f"Team '{team_to_kick}' not found to kick."})
                    return
            
            elif action == "save":
                room["logs"].append("💾 Auction state manually saved to server disk by Host.")
                
            elif action == "adjust_budget":
                team_to_adjust = data.get('team_name', '').strip()
                amount = data.get('amount', 0)
                if team_to_adjust in room["teams"]:
                    room["teams"][team_to_adjust]["budget"] += amount
                    friendly_amt = format_currency_python(abs(amount))
                    if amount >= 0:
                        log_msg = f"💰 Host added {friendly_amt} to {team_to_adjust}'s account."
                    else:
                        log_msg = f"💸 Host deducted {friendly_amt} from {team_to_adjust}'s account."
                    room["logs"].append(log_msg)
                else:
                    self.send_json_response(400, {"error": f"Team '{team_to_adjust}' not found."})
                    return
                    
            elif action == "undo":
                idx = room.get("last_completed_player_index")
                if idx is not None and 0 <= idx < len(room["players"]):
                    player = room["players"][idx]
                    
                    # Revert sold details
                    if player.get("status") == "sold":
                        prev_bidder = player.get("bought_by")
                        prev_price = player.get("price", 0)
                        if prev_bidder and prev_bidder in room["teams"]:
                            room["teams"][prev_bidder]["budget"] += prev_price
                            room["teams"][prev_bidder]["players"] = [p for p in room["teams"][prev_bidder]["players"] if p["id"] != player["id"]]
                            role = player["role"]
                            if role in room["teams"][prev_bidder]["slots"] and room["teams"][prev_bidder]["slots"][role] > 0:
                                room["teams"][prev_bidder]["slots"][role] -= 1
                                
                    player["status"] = "unsold"
                    player["bought_by"] = None
                    player["price"] = 0
                    
                    # Reopen bidding for this player
                    room["current_player_index"] = idx
                    room["status"] = "active"
                    room["current_bid"] = 0
                    room["current_bidder"] = None
                    room["timer"] = room["settings"]["timer_duration"]
                    room["timer_active"] = False
                    
                    undo_msg = f"🔄 UNDO: Host reverted the last action. Bidding reopened for {player['name']} (Base: {format_currency_python(player['base_price'])})."
                    room["logs"].append(undo_msg)
                    room["last_completed_player_index"] = None
                else:
                    self.send_json_response(400, {"error": "No recent sold/unsold action available to undo."})
                    return
                    
            elif action == "update_player_image":
                image_data = data.get('image_data', '')
                idx = room.get("current_player_index", -1)
                if 0 <= idx < len(room["players"]):
                    player = room["players"][idx]
                    player["img"] = image_data
                    room["logs"].append(f"📸 Host updated the photo for {player['name']}.")
                else:
                    self.send_json_response(400, {"error": "No active player to update image."})
                    return

            elif action == "update_standings":
                new_standings = data.get('standings', {})
                for team_name, stats in new_standings.items():
                    if team_name in room["teams"]:
                        room["standings"][team_name] = {
                            "played": int(stats.get('played', 0)),
                            "won": int(stats.get('won', 0)),
                            "lost": int(stats.get('lost', 0)),
                            "points": int(stats.get('points', 0)),
                            "nrr": float(stats.get('nrr', 0.0))
                        }
                room["logs"].append("📊 Host updated the Season Standings / Points Table.")

            elif action == "force_end_auction":
                room["status"] = "finished"
                room["timer_active"] = False
                room["current_bid"] = 0
                room["current_bidder"] = None
                room["logs"].append("🏁 Host manually ended the active auction draft.")

            elif action == "start_intermission":
                room["status"] = "post_draft_standings"
                room["logs"].append(f"📊 Season {room.get('season', 1)} draft stands saved! Room transitioned to Standings Intermission.")

            elif action == "end_season":
                post_season_settings = data.get("post_season_settings", {})
                trade_window_open = bool(post_season_settings.get("trade_window_open", True))
                retentions_enabled = bool(post_season_settings.get("retentions_enabled", True))
                retention_limit = int(post_season_settings.get("retention_limit", 3))
                
                room["status"] = "retention"
                room["trades"] = []
                room["retentions"] = {team: [] for team in room["teams"]}
                room["retention_locked"] = {team: False for team in room["teams"]}
                room["trade_window_open"] = trade_window_open
                
                # Apply these settings in settings dict
                room["settings"]["retentions_enabled"] = retentions_enabled
                room["settings"]["retention_limit"] = retention_limit
                
                status_str = "OPEN" if trade_window_open else "CLOSED"
                ret_str = f"ENABLED (Max {retention_limit} players)" if retentions_enabled else "DISABLED"
                room["logs"].append(f"🏁 Season {room.get('season', 1)} has officially ended! Host opened the Retention & Trading Window for Season {room.get('season', 1) + 1}. Settings: Trade Window: {status_str}, Retentions: {ret_str}.")

            elif action == "lock_season_retentions":
                prev_season = room.get("season", 1)
                next_season = prev_season + 1
                room["season"] = next_season
                
                retained_player_ids = set()
                for team_name, p_ids in room["retentions"].items():
                    for pid in p_ids:
                        retained_player_ids.add(int(pid))
                        
                for player in room["players"]:
                    pid = int(player["id"])
                    if pid in retained_player_ids:
                        retained_by_team = None
                        for team_name, p_ids in room["retentions"].items():
                            if pid in p_ids:
                                retained_by_team = team_name
                                break
                        player["bought_by"] = retained_by_team
                        player["status"] = "sold"
                    else:
                        player["status"] = "unsold"
                        player["bought_by"] = None
                        player["price"] = 0
                        if "passed" in player:
                            del player["passed"]
                            
                for team_name, team in room["teams"].items():
                    team_retained_ids = room["retentions"].get(team_name, [])
                    team_retained_players = []
                    retained_cost = 0
                    new_slots = {"Batsman": 0, "Bowler": 0, "All-Rounder": 0, "Wicket-Keeper": 0}
                    
                    for player in room["players"]:
                        if int(player["id"]) in team_retained_ids:
                            retained_cost += player.get("price", 0)
                            team_retained_players.append(player)
                            role = player["role"]
                            if role in new_slots:
                                new_slots[role] += 1
                                
                    team["players"] = team_retained_players
                    team["slots"] = new_slots
                    team["budget"] = room["settings"]["budget"] - retained_cost
                    
                room["current_player_index"] = -1
                room["current_bid"] = 0
                room["current_bidder"] = None
                room["timer"] = room["settings"]["timer_duration"]
                room["timer_active"] = False
                room["status"] = "active"
                
                room["trades"] = []
                room["retentions"] = {}
                room["retention_locked"] = {}
                
                room["logs"].append(f"🚀 Season {next_season} draft has officially started! Budgets re-calculated and released players returned to the pool.")

            elif action == "approve_trade":
                trade_id = data.get('trade_id')
                trade = None
                for t in room.get("trades", []):
                    if t["id"] == trade_id:
                        trade = t
                        break
                if not trade:
                    self.send_json_response(404, {"error": "Trade not found."})
                    return
                if trade["status"] != "accepted":
                    self.send_json_response(400, {"error": "Trade is not in accepted state."})
                    return
                    
                from_team_name = trade["from_team"]
                to_team_name = trade["to_team"]
                player_id = int(trade["player_id"])
                
                if from_team_name not in room["teams"] or to_team_name not in room["teams"]:
                    self.send_json_response(400, {"error": "One of the teams in the trade no longer exists."})
                    return
                    
                from_team = room["teams"][from_team_name]
                to_team = room["teams"][to_team_name]
                
                player = None
                for p in room["players"]:
                    if int(p["id"]) == player_id:
                        player = p
                        break
                if not player or player.get("bought_by") != from_team_name:
                    self.send_json_response(400, {"error": "Player is no longer owned by the selling team."})
                    return
                    
                if trade["type"] == "cash":
                    squad_limit = room["settings"].get("squad_limit", 16)
                    if len(to_team["players"]) >= squad_limit:
                        self.send_json_response(400, {"error": f"Cannot approve. Team '{to_team_name}' has reached the squad limit of {squad_limit} players."})
                        return
                    cash_value = int(trade["value"])
                    if to_team["budget"] < cash_value:
                        self.send_json_response(400, {"error": f"Cannot approve. Team '{to_team_name}' has insufficient budget."})
                        return
                        
                    to_team["budget"] -= cash_value
                    from_team["budget"] += cash_value
                    
                    player["bought_by"] = to_team_name
                    from_team["players"] = [p for p in from_team["players"] if int(p["id"]) != player_id]
                    to_team["players"].append(player)
                    
                    role = player["role"]
                    if role in from_team["slots"] and from_team["slots"][role] > 0:
                        from_team["slots"][role] -= 1
                    if role in to_team["slots"]:
                        to_team["slots"][role] += 1
                        
                    trade["status"] = "approved"
                    trade_msg = f"🤝 TRADE APPROVED: {player['name']} transferred from {from_team_name} to {to_team_name} for {format_currency_python(cash_value)}."
                    room["logs"].append(trade_msg)
                    
                elif trade["type"] == "player":
                    swap_player_id = int(trade["value"])
                    swap_player = None
                    for p in room["players"]:
                        if int(p["id"]) == swap_player_id:
                            swap_player = p
                            break
                    if not swap_player or swap_player.get("bought_by") != to_team_name:
                        self.send_json_response(400, {"error": "Offered swap player is no longer owned by target team."})
                        return
                        
                    player["bought_by"] = to_team_name
                    swap_player["bought_by"] = from_team_name
                    
                    from_team["players"] = [p for p in from_team["players"] if int(p["id"]) != player_id]
                    to_team["players"] = [p for p in to_team["players"] if int(p["id"]) != swap_player_id]
                    
                    from_team["players"].append(swap_player)
                    to_team["players"].append(player)
                    
                    for t in (from_team, to_team):
                        t["slots"] = {"Batsman": 0, "Bowler": 0, "All-Rounder": 0, "Wicket-Keeper": 0}
                        for p in t["players"]:
                            role = p["role"]
                            if role in t["slots"]:
                                t["slots"][role] += 1
                                
                    trade["status"] = "approved"
                    trade_msg = f"🤝 TRADE APPROVED: Swap completed! {player['name']} moved to {to_team_name}, and {swap_player['name']} moved to {from_team_name}."
                    room["logs"].append(trade_msg)

            elif action == "reject_trade":
                trade_id = data.get('trade_id')
                trade = None
                for t in room.get("trades", []):
                    if t["id"] == trade_id:
                        trade = t
                        break
                if not trade:
                    self.send_json_response(404, {"error": "Trade not found."})
                    return
                trade["status"] = "rejected"
                room["logs"].append("❌ Trade proposal rejected by Host.")

            elif action == "open_trade_window":
                room["trade_window_open"] = True
                room["logs"].append("🚪 Host opened the Franchise Trade Window!")
                
            elif action == "close_trade_window":
                room["trade_window_open"] = False
                room["logs"].append("🔒 Host closed the Franchise Trade Window!")

            elif action == "end_tournament":
                room["status"] = "tournament_ended"
                room["logs"].append("🏆 Host has officially ended the tournament! Standings are now finalized.")
                     
            save_room_to_disk(room_code)
            broadcast(room_code, "state_update", get_serializable_room(room))
            
        self.send_json_response(200, {"success": True, "room_state": get_serializable_room(room)})

    def handle_trade(self, data):
        room_code = data.get('room_code', '').upper()
        team_name = data.get('team_name', '')
        action = data.get('action', '')
        
        if room_code not in rooms:
            self.send_json_response(404, {"error": "Room not found"})
            return
            
        with rooms_lock:
            room = rooms[room_code]
            if team_name not in room["teams"]:
                self.send_json_response(403, {"error": "Unauthorized. Team not in room."})
                return
                
            if action in ("propose", "respond"):
                if not room.get("trade_window_open"):
                    self.send_json_response(400, {"error": "The Trade Window is currently closed by the Host."})
                    return

            if action == "propose":
                to_team = data.get('to_team', '')
                player_id = int(data.get('player_id', 0))
                trade_type = data.get('type', '')
                trade_value = data.get('value')
                
                if trade_type == "cash":
                    self.send_json_response(400, {"error": "Cash trades are disabled. Only player swaps are permitted."})
                    return
                
                if to_team not in room["teams"] or to_team == team_name:
                    self.send_json_response(400, {"error": "Invalid target team."})
                    return
                    
                player = None
                for p in room["players"]:
                    if int(p["id"]) == player_id:
                        player = p
                        break
                if not player or player.get("bought_by") != team_name:
                    self.send_json_response(400, {"error": "You do not own this player."})
                    return
                    
                if trade_type == "player":
                    swap_player_id = int(trade_value)
                    swap_player = None
                    for p in room["players"]:
                        if int(p["id"]) == swap_player_id:
                            swap_player = p
                            break
                    if not swap_player or swap_player.get("bought_by") != to_team:
                        self.send_json_response(400, {"error": "Target team does not own requested player."})
                        return
                    trade_desc = f"offered swap for {swap_player['name']}"
                elif trade_type == "cash":
                    cash_val = int(trade_value)
                    if cash_val <= 0:
                        self.send_json_response(400, {"error": "Trade cash value must be positive."})
                        return
                    if room["teams"][to_team]["budget"] < cash_val:
                        self.send_json_response(400, {"error": "Target team cannot afford this trade."})
                        return
                    trade_desc = f"for {format_currency_python(cash_val)}"
                else:
                    self.send_json_response(400, {"error": "Invalid trade type."})
                    return
                    
                trade_id = str(uuid.uuid4())[:8]
                new_trade = {
                    "id": trade_id,
                    "from_team": team_name,
                    "to_team": to_team,
                    "player_id": player_id,
                    "type": trade_type,
                    "value": trade_value,
                    "status": "pending"
                }
                if "trades" not in room:
                    room["trades"] = []
                room["trades"].append(new_trade)
                room["logs"].append(f"🤝 TRADE OFFER: {team_name} proposed trading {player['name']} to {to_team} {trade_desc}.")
                
            elif action == "respond":
                trade_id = data.get('trade_id', '')
                response = data.get('response', '')
                
                trade = None
                for t in room.get("trades", []):
                    if t["id"] == trade_id:
                        trade = t
                        break
                if not trade:
                    self.send_json_response(404, {"error": "Trade proposal not found."})
                    return
                if trade["to_team"] != team_name:
                    self.send_json_response(403, {"error": "Unauthorized."})
                    return
                if trade["status"] != "pending":
                    self.send_json_response(400, {"error": "Trade is no longer pending."})
                    return
                    
                player_name = "Player"
                for p in room["players"]:
                    if int(p["id"]) == int(trade["player_id"]):
                        player_name = p["name"]
                        break
                        
                if response == "accept":
                    trade["status"] = "accepted"
                    room["logs"].append(f"✅ TRADE ACCEPTED: {team_name} accepted {trade['from_team']}'s trade for {player_name}. Awaiting Host Approval.")
                else:
                    trade["status"] = "declined"
                    room["logs"].append(f"❌ TRADE DECLINED: {team_name} declined {trade['from_team']}'s trade for {player_name}.")
                    
            elif action == "toggle_retain":
                player_id = int(data.get('player_id', 0))
                if room["status"] != "retention":
                    self.send_json_response(400, {"error": "Retentions only allowed in Retention Phase."})
                    return
                if room["retention_locked"].get(team_name, False):
                    self.send_json_response(400, {"error": "Your retentions are locked!"})
                    return
                    
                # Check if retentions are enabled
                ret_enabled = room["settings"].get("retentions_enabled", True)
                if not ret_enabled:
                    self.send_json_response(400, {"error": "Player retentions are disabled by the Host for this season."})
                    return
                    
                player = None
                for p in room["players"]:
                    if int(p["id"]) == player_id:
                        player = p
                        break
                if not player or player.get("bought_by") != team_name:
                    self.send_json_response(400, {"error": "Player is not in your squad."})
                    return
                    
                if team_name not in room["retentions"]:
                    room["retentions"][team_name] = []
                    
                if player_id in room["retentions"][team_name]:
                    room["retentions"][team_name].remove(player_id)
                    room["logs"].append(f"ℹ️ {team_name} removed {player['name']} from retentions.")
                else:
                    ret_limit = room["settings"].get("retention_limit", 3)
                    if len(room["retentions"][team_name]) >= ret_limit:
                        self.send_json_response(400, {"error": f"Maximum {ret_limit} players can be retained."})
                        return
                    room["retentions"][team_name].append(player_id)
                    room["logs"].append(f"📌 {team_name} marked {player['name']} to be retained.")
                    
            elif action == "lock_retentions":
                lock = bool(data.get('lock', False))
                if room["status"] != "retention":
                    self.send_json_response(400, {"error": "Not in retention phase."})
                    return
                room["retention_locked"][team_name] = lock
                status_word = "locked" if lock else "unlocked"
                room["logs"].append(f"🔒 {team_name} {status_word} their retentions.")
            else:
                self.send_json_response(400, {"error": "Invalid action."})
                return
                
            save_room_to_disk(room_code)
            broadcast(room_code, "state_update", get_serializable_room(room))
            
        self.send_json_response(200, {"success": True, "room_state": get_serializable_room(room)})

    def handle_chat(self, data):
        room_code = data.get('room_code', '').upper()
        role = data.get('role', '')
        sender_name = data.get('sender_name', 'System')
        message = data.get('message', '').strip()
        
        if room_code not in rooms:
            self.send_json_response(404, {"error": "Room not found"})
            return
            
        if not message:
            self.send_json_response(400, {"error": "Message is empty"})
            return
            
        with rooms_lock:
            room = rooms[room_code]
            if role == 'host':
                chat_msg = f"💬 <strong style='color: var(--accent-cyan);'>[Host] {sender_name}</strong>: {message}"
            else:
                chat_msg = f"💬 <strong style='color: var(--accent-purple);'>[{sender_name}]</strong>: {message}"
                
            room["logs"].append(chat_msg)
            save_room_to_disk(room_code)
            broadcast(room_code, "state_update", get_serializable_room(room))
            
        self.send_json_response(200, {"success": True})

    def handle_history(self, data):
        auth_token = data.get('auth_token')
        username = get_user_from_token(auth_token)
        if not username:
            self.send_json_response(401, {"error": "Authentication is required to view history."})
            return
            
        user_rooms = []
        with rooms_lock:
            for room_code, room in rooms.items():
                is_host = room.get("host_username") == username
                
                is_member = False
                user_team_name = ""
                user_manager_name = ""
                for t_name, t_info in room.get("teams", {}).items():
                    if t_info.get("username") == username:
                        is_member = True
                        user_team_name = t_name
                        user_manager_name = t_info.get("manager", "")
                        break
                        
                if is_host or is_member:
                    # Calculate simple stats
                    sold_count = sum(1 for p in room.get("players", []) if p.get("status") == "sold")
                    unsold_count = sum(1 for p in room.get("players", []) if p.get("status") in ["unsold", "passed"])
                    
                    user_rooms.append({
                        "room_code": room_code,
                        "auction_name": room.get("auction_name", "Cricket Auction"),
                        "host_name": room.get("host_name", "Host"),
                        "host_id": room.get("host_id", "") if is_host else "",
                        "created_at": room.get("created_at", "N/A"),
                        "status": room.get("status", "lobby"),
                        "team_count": len(room.get("teams", {})),
                        "player_count": len(room.get("players", [])),
                        "sold_count": sold_count,
                        "unsold_count": unsold_count,
                        "user_role": "host" if is_host else "manager",
                        "team_name": user_team_name,
                        "manager_name": user_manager_name
                    })
        
        # Sort history by created_at descending if possible, or room code
        user_rooms.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        self.send_json_response(200, {"success": True, "auctions": user_rooms})

    def handle_get_room(self, data):
        room_code = data.get('room_code', '').upper()
        if room_code not in rooms:
            self.send_json_response(404, {"error": "Room not found"})
            return
            
        with rooms_lock:
            room = rooms[room_code]
            self.send_json_response(200, {"success": True, "room_state": get_serializable_room(room)})

    def handle_delete_room(self, data):
        auth_token = data.get('auth_token')
        room_code = data.get('room_code', '').upper()
        
        username = get_user_from_token(auth_token)
        if not username:
            self.send_json_response(401, {"error": "Authentication is required."})
            return
            
        if room_code not in rooms:
            self.send_json_response(404, {"error": "Room not found."})
            return
            
        with rooms_lock:
            room = rooms[room_code]
            if room.get("host_username") != username:
                self.send_json_response(403, {"error": "Only the host can delete this room."})
                return
                
            # Remove from active rooms
            del rooms[room_code]
            
            db.delete_room(room_code)
                
        self.send_json_response(200, {"success": True})

def run_server():
    # If PORT is specified in env, we must bind to it exactly (Render/Heroku requirement)
    env_port = os.environ.get('PORT')
    if env_port:
        port = int(env_port)
        ports_to_try = [port]
    else:
        # Automatically scan for an open port starting from 8000
        port = 8000
        ports_to_try = range(8000, 8100)
    
    # SimpleHTTPRequestHandler overrides serving location to the workspace directory
    # We serve static assets from 'public/'
    public_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')
    if not os.path.exists(public_path):
        os.makedirs(public_path)
        
    class PublicDirectoryHTTPHandler(AuctionHTTPHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=public_path, **kwargs)
            
    for p in ports_to_try:
        try:
            server_address = ('', p)
            httpd = ThreadingHTTPServer(server_address, PublicDirectoryHTTPHandler)
            sys.stderr.write("\n=======================================================\n")
            sys.stderr.write("CRICKET MULTIPLAYER AUCTION SERVER RUNNING\n")
            sys.stderr.write(f"Access Port: {p}\n")
            
            # Attempt to output local network IP for Wi-Fi players
            import socket
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                ip = s.getsockname()[0]
                s.close()
                sys.stderr.write(f"Multiplayer Network Access: http://{ip}:{p}\n")
            except Exception:
                pass
            sys.stderr.write("=======================================================\n\n")
            sys.stderr.flush()
            httpd.serve_forever()
            break
        except OSError as e:
            if env_port:
                print(f"Error binding to assigned PORT {p}: {e}")
                sys.exit(1)
            # Port in use, try next
            continue

if __name__ == '__main__':
    run_server()
