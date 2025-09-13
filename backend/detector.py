import cv2
import mediapipe as mp

class HandDetector:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=0.75,
            min_tracking_confidence=0.75)
    
    def detect(self, frame):
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)
        return self._serialize_results(results)

    def _serialize_results(self, results):
        hands = []
        if results.multi_hand_landmarks:
            for idx, landmarks in enumerate(results.multi_hand_landmarks):
                try:
                    handedness = results.multi_handedness[idx].classification[0].label
                    hand = {
                        "handedness": handedness,
                        "landmarks": [(float(lm.x), float(lm.y), float(lm.z)) for lm in landmarks.landmark],
                        "connections": [[int(conn[0]), int(conn[1])] for conn in self.mp_hands.HAND_CONNECTIONS]
                    }
                    hands.append(hand)
                except (IndexError, AttributeError):
                    continue
        return hands