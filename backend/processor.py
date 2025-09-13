import eventlet
eventlet.monkey_patch()

import cv2
from webserver import socketio, app
from detector import HandDetector

class VisionProcessor:
    def __init__(self):
        self.cap = cv2.VideoCapture(0)
        self.detector = HandDetector()
        self.last_hands = []

    def process_video(self):
        with app.app_context():
            while True:
                success, frame = self.cap.read()
                if not success:
                    continue
                
                frame = cv2.flip(frame, 1)
                hands_data = self.detector.detect(frame)
                
                if hands_data != self.last_hands:
                    try:
                        socketio.emit('hand_data', hands_data)
                        self.last_hands = hands_data
                    except Exception as e:
                        print("Emit error:", str(e))
                
                eventlet.sleep(0.001)

if __name__ == '__main__':
    processor = VisionProcessor()
    processor.process_video()