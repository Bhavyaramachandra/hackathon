from flask import Flask, render_template, Response
from flask_socketio import SocketIO, emit
import cv2
import threading

app = Flask(__name__)
socketio = SocketIO(app)

# Video capture object
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FPS, 60)

# Motion detection control flags
motion_detection_active = False
video_feed_paused = False
current_level = 0

def detect_motion(current_frame, previous_frame):
    """Detect motion between two frames."""
    # Convert frames to grayscale
    gray_current = cv2.cvtColor(current_frame, cv2.COLOR_BGR2GRAY)
    gray_previous = cv2.cvtColor(previous_frame, cv2.COLOR_BGR2GRAY)
    
    # Compute absolute difference between frames
    frame_diff = cv2.absdiff(gray_current, gray_previous)
    
    # Apply threshold to filter out small differences
    _, threshold = cv2.threshold(frame_diff, 15, 255, cv2.THRESH_BINARY)
    
    # Find contours of thresholded image
    contours, _ = cv2.findContours(threshold, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Check for motion based on contour area
    for contour in contours:
        if cv2.contourArea(contour) > 100:  # Adjust this threshold
            return True
    return False

def generate_frames():
    """Generate video frames and detect motion when active."""
    global motion_detection_active, current_level, video_feed_paused
    
    # Reinitialize video capture to ensure fresh frames
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    # Initialize previous frame
    _, previous_frame = cap.read()
    
    while True:
        # Read current frame from webcam
        ret, current_frame = cap.read()
        if not ret:
            break
        
        # Check for motion if detection is active and feed is not paused
        if motion_detection_active and not video_feed_paused:
            motion_detected = detect_motion(current_frame, previous_frame)
            
            if motion_detected:
                # Emit a motion detection event
                socketio.emit('motion_detected', {
                    'message': f"Motion detected in this Level! Make sure you don't move while playing the game."
                })
                
                # Pause video feed and deactivate motion detection
                video_feed_paused = True
                motion_detection_active = False
                

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
    """Render the game interface."""
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    """Stream video feed."""
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@socketio.on('start_detection')
def start_detection():
    """Start motion detection."""
    global motion_detection_active, video_feed_paused, current_level
    motion_detection_active = True
    video_feed_paused = False
    print(f"Motion detection started for Level {current_level + 1}.")

@socketio.on('stop_detection')
def stop_detection():
    """Stop motion detection."""
    global motion_detection_active, video_feed_paused
    motion_detection_active = False
    video_feed_paused = False
    print("Motion detection stopped.")

@socketio.on('reset_video_feed')
def reset_video_feed():
    """Reset video feed and set current level."""
    global current_level, motion_detection_active, video_feed_paused
    
    # Reset video capture to ensure fresh frames
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    
    # Increment level
    current_level += 1
    
    # Reset detection flags
    motion_detection_active = False
    video_feed_paused = False
    
    print(f"Video feed reset for Level {current_level}")

@socketio.on('resume_video_feed')
def resume_video_feed():
    """Resume video feed and motion detection."""
    global motion_detection_active, video_feed_paused
    motion_detection_active = True
    video_feed_paused = False
    print("Video feed resumed.")

if __name__ == '__main__':
    socketio.run(app, debug=True)