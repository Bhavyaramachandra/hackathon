from flask import Flask, render_template, Response
from flask_socketio import SocketIO,emit
import cv2

app = Flask(__name__)
socketio=SocketIO(app)
# Function to detect motion
def detect_motion(current_frame, previous_frame):
    # Convert frames to grayscale
    gray_current = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY)
    gray_previous = cv2.cvtColor(previous_frame, cv2.COLOR_BGR2GRAY)
    
    # Compute absolute difference between frames
    frame_diff = cv2.absdiff(gray_current, gray_previous)
    
    # Apply threshold to filter out small differences
    _, threshold = cv2.threshold(frame_diff, 30, 255, cv2.THRESH_BINARY)
    
    # Find contours of thresholded image
    contours, _ = cv2.findContours(threshold, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Iterate through contours and find motion
    motion_detected = False
    for contour in contours:
        if cv2.contourArea(contour) > 1000: # Adjust this threshold based on your application
            motion_detected = True
            break
    
    return motion_detected

# Video capture object
cap = cv2.VideoCapture(0)

def generate_frames():
    # Initialize previous frame
    _, previous_frame = cap.read()
    motion_detected=False

    while True:
        # Read current frame from webcam
        ret, current_frame = cap.read()
        if not ret:
            break
        if not motion_detected:
        # Detect motion
            motion_detected = detect_motion(current_frame, previous_frame)

        if motion_detected:
            socketio.emit('motion_detected',{
                'message':"Motion detected! Make sure you don't move while playing the game and the game will be restarted."
                })

            motion_detected=False
        # Update previous frame
        previous_frame = current_frame.copy()

        # Encode the frame in JPEG format
        ret, buffer = cv2.imencode('.jpg', current_frame)
        frame = buffer.tobytes()

        # Yield the output frame in byte format
        yield (b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    socketio.run(app,debug=True)
