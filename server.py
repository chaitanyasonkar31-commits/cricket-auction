import os
import sys
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
        print(f"Error creating persistent directory: {e}")

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
                print("Connecting to cloud PostgreSQL database...")
            except ImportError:
                print("Warning: DATABASE_URL is set but 'psycopg2' is not installed. Falling back to local SQLite.")
                
        if not self.is_postgres:
            self.sqlite_path = os.path.join(persistent_dir, 'auction.db')
            print(f"Connecting to local SQLite database at: {self.sqlite_path}")
            
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
            import psycopg2
            url = self.db_url
            if url.startswith('postgres://'):
                url = url.replace('postgres://', 'postgresql://', 1)
            return psycopg2.connect(url)
        else:
            return sqlite3.connect(self.sqlite_path)

    def init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
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
        finally:
            conn.close()

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
    db.save_room(room_code, rooms[room_code])

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
    payload = {
        "type": event_type,
        "data": data,
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

def advance_to_next_player(room_code, role_filter="All"):
    room = rooms[room_code]
    idx = room["current_player_index"]
    next_unsold = -1
    
    # If starting for the first time
    if idx == -1:
        # Find first unsold player matching role_filter
        for i, p in enumerate(room["players"]):
            if p.get("status", "unsold") == "unsold" and p.get("bought_by") is None:
                if not role_filter or role_filter == "All" or p.get("role") == role_filter:
                    next_unsold = i
                    break
        action_msg = "🎬 Auction started!"
    else:
        # Search starting after current index
        for i in range(idx + 1, len(room["players"])):
            p = room["players"][i]
            if p.get("status", "unsold") == "unsold" and p.get("bought_by") is None:
                if not role_filter or role_filter == "All" or p.get("role") == role_filter:
                    next_unsold = i
                    break
                    
        # Wrap around if not found
        if next_unsold == -1:
            for i in range(0, idx + 1):
                p = room["players"][i]
                if p.get("status", "unsold") == "unsold" and p.get("bought_by") is None:
                    if not role_filter or role_filter == "All" or p.get("role") == role_filter:
                        next_unsold = i
                        break
        action_msg = "🏏 Next up:"

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
                    "data": get_serializable_room(room),
                    "timestamp": time.time()
                }
                q.put(init_payload)
            
            # Streaming loop
            try:
                while True:
                    try:
                        # Wait for a new event with 5s timeout to send heartbeat keep-alive
                        msg = q.get(timeout=5.0)
                        event_str = f"event: {msg['type']}\ndata: {json.dumps(msg['data'])}\n\n"
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
                # Limit room to 10 users
                if len(room["teams"]) >= 10:
                    self.send_json_response(400, {"error": "Room is full! Maximum 10 teams allowed."})
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
            if len(team["players"]) >= 16:
                self.send_json_response(400, {"error": "Squad is full! Maximum 16 players allowed per team."})
                return
                
            # Check budget
            if amount > team["budget"]:
                self.send_json_response(400, {"error": f"Insufficient budget! Your budget is {format_currency_python(team['budget'])}."})
                return
                
            # Verify minimum bid amount
            if room["current_bid"] == 0:
                min_req = player["base_price"]
            else:
                min_req = room["current_bid"] + room["settings"]["min_increment"]
                
            if amount < min_req:
                self.send_json_response(400, {"error": f"Bid must be at least {format_currency_python(min_req)}!"})
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
                success, msg = advance_to_next_player(room_code, role_filter)
                if not success:
                    self.send_json_response(400, {"error": msg})
                    return
                    
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
                if room.get("host_username") == username:
                    # Calculate simple stats
                    sold_count = sum(1 for p in room.get("players", []) if p.get("status") == "sold")
                    unsold_count = sum(1 for p in room.get("players", []) if p.get("status") == "unsold")
                    
                    user_rooms.append({
                        "room_code": room_code,
                        "auction_name": room.get("auction_name", "Cricket Auction"),
                        "host_name": room.get("host_name", "Host"),
                        "host_id": room.get("host_id", ""),
                        "created_at": room.get("created_at", "N/A"),
                        "status": room.get("status", "lobby"),
                        "team_count": len(room.get("teams", {})),
                        "player_count": len(room.get("players", [])),
                        "sold_count": sold_count,
                        "unsold_count": unsold_count
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
            print("\n=======================================================")
            print("CRICKET MULTIPLAYER AUCTION SERVER RUNNING")
            print(f"Access Port: {p}")
            
            # Attempt to output local network IP for Wi-Fi players
            import socket
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                ip = s.getsockname()[0]
                s.close()
                print(f"Multiplayer Network Access: http://{ip}:{p}")
            except Exception:
                pass
            print("=======================================================\n")
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
