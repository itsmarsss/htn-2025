import cv2
import numpy as np
import mediapipe as mp

class HandProcessor:
    def __init__(self):
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_hands = mp.solutions.hands
        self.grid_size = 400
        self.margin = 0.3
        
    def process_hand(self, frame, landmarks, handedness):
        # Draw on main frame
        annotated_frame = frame.copy()
        self.mp_drawing.draw_landmarks(
            annotated_frame,
            landmarks,
            self.mp_hands.HAND_CONNECTIONS,
            self.mp_drawing.DrawingSpec(color=(0,255,0), thickness=2),
            self.mp_drawing.DrawingSpec(color=(0,0,255), thickness=2))
        
        # Create grid visualization
        grid_canvas = np.zeros((self.grid_size, self.grid_size, 3), dtype=np.uint8)
        self._draw_grid(grid_canvas)
        
        try:
            # Safety checks for landmarks
            xs = [lm.x for lm in landmarks.landmark]
            ys = [lm.y for lm in landmarks.landmark]
            if not xs or not ys:
                return annotated_frame, grid_canvas
            
            min_x, max_x = min(xs), max(xs)
            min_y, max_y = min(ys), max(ys)
            
            # Handle edge cases where hand is off-screen
            if max_x - min_x < 0.01 or max_y - min_y < 0.01:
                return annotated_frame, grid_canvas
                
            self._draw_upright_connections(grid_canvas, landmarks, min_x, max_x, min_y, max_y)
            
            hand_type = "Right" if "Left" in handedness.classification[0].label else "Left"
            cv2.putText(grid_canvas, hand_type, (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
        except Exception as e:
            print(f"Hand processing error: {str(e)}")
        
        return annotated_frame, grid_canvas

    def _draw_upright_connections(self, canvas, landmarks, min_x, max_x, min_y, max_y):
        connections = self.mp_hands.HAND_CONNECTIONS
        for connection in connections:
            start_idx, end_idx = connection
            start_lm = landmarks.landmark[start_idx]
            end_lm = landmarks.landmark[end_idx]
            
            # Convert to grid coordinates with safety checks
            try:
                x1 = int((start_lm.x - min_x) / (max_x - min_x) * self.grid_size)
                y1 = self.grid_size - int((start_lm.y - min_y) / (max_y - min_y) * self.grid_size)
                x2 = int((end_lm.x - min_x) / (max_x - min_x) * self.grid_size)
                y2 = self.grid_size - int((end_lm.y - min_y) / (max_y - min_y) * self.grid_size)
                
                cv2.line(canvas, (x1, y1), (x2, y2), (255, 255, 255), 2)
                cv2.circle(canvas, (x1, y1), 3, (0, 255, 0), -1)
                cv2.circle(canvas, (x2, y2), 3, (0, 255, 0), -1)
            except:
                continue

    def _draw_grid(self, canvas, spacing=50):
        color = (60, 60, 60)
        for x in range(0, self.grid_size, spacing):
            cv2.line(canvas, (x, 0), (x, self.grid_size), color, 1)
        for y in range(0, self.grid_size, spacing):
            cv2.line(canvas, (0, y), (self.grid_size, y), color, 1)