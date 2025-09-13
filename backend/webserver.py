import datetime
import eventlet
import orjson
import cv2
import mediapipe as mp
import numpy as np
import base64
import json
from eventlet import wsgi
from eventlet.websocket import WebSocketWSGI
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from scipy.spatial.distance import cdist

eventlet.monkey_patch()

app = Flask(__name__)
CORS(app)

# MediaPipe setup
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=2,
    min_detection_confidence=0.65,
    min_tracking_confidence=0.65
)

# Store hand symbols
hand_symbols = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save_handsymbol', methods=['POST'])
def save_handsymbol():
    data = request.json
    name, handedness, landmarks = data['name'], data['handedness'], data['landmarks']
    
    wrist = landmarks[0]
    normalized_landmarks = np.array(landmarks) - wrist
    
    middle_finger_mcp = normalized_landmarks[9]
    angle = np.arctan2(middle_finger_mcp[1], middle_finger_mcp[0])
    rotation_matrix = np.array([
        [np.cos(-angle), -np.sin(-angle)],
        [np.sin(-angle), np.cos(-angle)]
    ])
    rotated_landmarks = np.hstack((normalized_landmarks[:, :2] @ rotation_matrix.T, normalized_landmarks[:, 2:]))
    
    hand_symbols.append({
        'name': name,
        'handedness': handedness,
        'landmarks': rotated_landmarks.flatten()
    })

    return jsonify({'status': 'success'})

@WebSocketWSGI
def handle_websocket(ws):
    while True:
        message = ws.wait()
        if message is None:
            break
        try:
            start_time = datetime.datetime.now()

            if isinstance(message, bytes):
                frame_bytes = message
            else:
                payload = json.loads(message)
                image_data = payload.get("image", "")
                if image_data.startswith("data:image"):
                    header, encoded = image_data.split(",", 1)
                    frame_bytes = base64.b64decode(encoded)
                else:
                    frame_bytes = None
            
            if frame_bytes is not None:
                np_arr = np.frombuffer(frame_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                frame = cv2.resize(frame, (640, 360))
                h, w = frame.shape[:2]

                if (datetime.datetime.now() - start_time).total_seconds() * 1000 > 50:
                    print("Skipping frame: Pre-processing too slow")
                    ws.send(orjson.dumps({'status': 'dropped'}))
                    continue

                results = hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if (datetime.datetime.now() - start_time).total_seconds() * 1000 > 50:
                    print("Skipping frame: Hand processing too slow")
                    ws.send(orjson.dumps({'status': 'dropped'}))
                    continue

                hands_data = []
                detected = {"Left": False, "Right": False}

                if results.multi_hand_landmarks:
                    for idx, landmarks in enumerate(results.multi_hand_landmarks):
                        if (datetime.datetime.now() - start_time).total_seconds() * 1000 > 50:
                            print("Skipping frame: Exceeded time limit in loop")
                            ws.send(orjson.dumps({'status': 'dropped'}))
                            break
                        
                        handedness = results.multi_handedness[idx].classification[0].label
                        if detected[handedness]:
                            continue
                        detected[handedness] = True
                        
                        hand_landmarks = np.array([[lm.x * w, lm.y * h, lm.z] for lm in landmarks.landmark])
                        wrist = hand_landmarks[0]
                        normalized_landmarks = hand_landmarks - wrist
                        
                        middle_finger_mcp = normalized_landmarks[9]
                        angle = np.arctan2(middle_finger_mcp[1], middle_finger_mcp[0])
                        rotation_matrix = np.array([
                            [np.cos(-angle), -np.sin(-angle)],
                            [np.sin(-angle),  np.cos(-angle)]
                        ])
                        rotated_landmarks = np.hstack((normalized_landmarks[:, :2] @ rotation_matrix.T, normalized_landmarks[:, 2:]))
                        flattened_landmarks = rotated_landmarks.flatten()

                        detected_symbols = []
                        if hand_symbols:
                            symbol_landmarks = np.array([
                                symbol['landmarks']
                                for symbol in hand_symbols if symbol['handedness'] == handedness
                            ])
                            if symbol_landmarks.size > 0:
                                similarities = (1 - cdist([flattened_landmarks], symbol_landmarks, metric='cosine')[0]).tolist()
                                detected_symbols = sorted(
                                    zip([s['name'] for s in hand_symbols if s['handedness'] == handedness], similarities),
                                    key=lambda x: x[1],
                                    reverse=True
                                )[:3]
                        
                        hands_data.append({
                            'handedness': handedness,
                            'landmarks': hand_landmarks.round(3).tolist(),
                            'connections': [[conn[0], conn[1]] for conn in mp_hands.HAND_CONNECTIONS],
                            'detected_symbols': detected_symbols
                        })
                
                if (datetime.datetime.now() - start_time).total_seconds() * 1000 > 50:
                    print("Skipping frame: Final check exceeded 50ms")
                    ws.send(orjson.dumps({'status': 'dropped'}))
                    continue

                print(datetime.datetime.now().strftime("%H:%M:%S") + " returned")
                ws.send(orjson.dumps({'status': 'success', 'hands': hands_data, 'image_size': {'width': w, 'height': h}}))
        except Exception as e:
            print("WebSocket error:", str(e))

def combined_app(environ, start_response):
    path = environ['PATH_INFO']
    if path == '/ws':
        return handle_websocket(environ, start_response)
    return app(environ, start_response)

if __name__ == '__main__':
    wsgi.server(eventlet.listen(('0.0.0.0', 6969), reuse_port=True), combined_app)
