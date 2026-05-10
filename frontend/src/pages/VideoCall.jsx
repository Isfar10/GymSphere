import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "../components/Navbar";
import PageShell from "../components/PageShell";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = "http://localhost:5000";

const iceServers = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
  ],
};

function VideoCall() {
  const { user } = useAuth();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const joinedRoomRef = useRef("");

  const [roomId, setRoomId] = useState("");
  const [joinedRoom, setJoinedRoom] = useState("");
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const currentUserName = user?.name || "User";

  const createPeerConnection = () => {
    const peerConnection = new RTCPeerConnection(iceServers);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && joinedRoomRef.current) {
        socketRef.current.emit("video:ice-candidate", {
            roomId: joinedRoomRef.current,
            candidate: event.candidate,
        });
      }
    };

    peerConnection.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const state = peerConnection.connectionState;

      if (state === "connected") {
        setStatus("Connected");
      }

      if (state === "disconnected") {
        setStatus("Disconnected");
      }

      if (state === "failed") {
        setStatus("Connection failed");
      }
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  };

  const startLocalMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    return stream;
  };

  const connectSocket = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in to start a video call.");
      return null;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },
    });

    socket.on("connect", () => {
      setIsConnected(true);
      setStatus("Socket connected");
    });

    socket.on("connect_error", (err) => {
      setError(err.message || "Socket connection failed.");
      setIsConnected(false);
    });

    socket.on("video:user-joined", async () => {
      try {
        setStatus("Another user joined. Creating offer...");

        const peerConnection =
          peerConnectionRef.current || createPeerConnection();

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit("video:offer", {
          roomId: joinedRoomRef.current,
          offer,
        });
      } catch (err) {
        setError(err.message || "Failed to create call offer.");
      }
    });

    socket.on("video:offer", async ({ offer }) => {
      try {
        setStatus("Incoming call offer received...");

        const peerConnection =
          peerConnectionRef.current || createPeerConnection();

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        socket.emit("video:answer", {
            roomId: joinedRoomRef.current,
            answer,
        });
      } catch (err) {
        setError(err.message || "Failed to answer call.");
      }
    });

    socket.on("video:answer", async ({ answer }) => {
      try {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection) return;

        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );

        setStatus("Call connected");
      } catch (err) {
        setError(err.message || "Failed to process answer.");
      }
    });

    socket.on("video:ice-candidate", async ({ candidate }) => {
      try {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection || !candidate) return;

        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add ICE candidate:", err);
      }
    });

    socket.on("video:user-left", () => {
      setStatus("The other user left the call.");

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    socketRef.current = socket;
    return socket;
  };

  const joinCall = async () => {
    try {
      setError("");

      const cleanRoomId = roomId.trim();

      if (!cleanRoomId) {
        setError("Enter a room ID first.");
        return;
      }

      await startLocalMedia();

      const socket = socketRef.current || connectSocket();

      if (!socket) return;

      setJoinedRoom(cleanRoomId);
      joinedRoomRef.current = cleanRoomId;
      setStatus(`Joined room: ${cleanRoomId}`);

      createPeerConnection();

      socket.emit("video:join-room", {
        roomId: cleanRoomId,
      });
    } catch (err) {
      setError(
        err.message ||
          "Could not access camera/microphone. Please allow browser permissions."
      );
    }
  };

  const leaveCall = () => {
    if (socketRef.current && joinedRoom) {
      socketRef.current.emit("video:leave-room", {
        roomId: joinedRoom,
      });
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setJoinedRoom("");
    joinedRoomRef.current = "";
    setStatus("Call ended");
  };

  const toggleCamera = () => {
    const videoTrack = localStreamRef.current
      ?.getVideoTracks()
      ?.find(Boolean);

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    setIsCameraOn(videoTrack.enabled);
  };

  const toggleMic = () => {
    const audioTrack = localStreamRef.current
      ?.getAudioTracks()
      ?.find(Boolean);

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    setIsMicOn(audioTrack.enabled);
  };

  useEffect(() => {
    connectSocket();

    return () => {
      leaveCall();

      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <>
      <Navbar />

      <PageShell
        eyebrow="Live Training"
        title="Real-Time Video Call"
        subtitle="Start a secure trainer-trainee video session for virtual workout support."
        heroIcon="🎥"
      >
        {error && <div style={styles.error}>{error}</div>}

        <section style={styles.statusCard}>
          <div>
            <p style={styles.kicker}>Connection</p>
            <h2 style={styles.title}>{status}</h2>
            <p style={styles.muted}>
              Logged in as {currentUserName}. Socket status:{" "}
              {isConnected ? "Connected" : "Not connected"}.
            </p>
          </div>
        </section>

        <section style={styles.joinCard}>
          <label className="gs-label" style={styles.roomLabel}>
            Room ID
            <input
              value={roomId}
              onChange={(event) => setRoomId(event.target.value)}
              placeholder="Example: trainer-jafran-session-1"
              className="gs-input"
              disabled={Boolean(joinedRoom)}
            />
          </label>

          {!joinedRoom ? (
            <button type="button" onClick={joinCall} className="gs-button">
              Join Video Call
            </button>
          ) : (
            <button type="button" onClick={leaveCall} className="gs-button-danger">
              Leave Call
            </button>
          )}
        </section>

        <section style={styles.videoGrid}>
          <div style={styles.videoCard}>
            <div style={styles.videoHeader}>
              <strong>You</strong>
              <span>{isCameraOn ? "Camera On" : "Camera Off"}</span>
            </div>

            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              style={styles.video}
            />

            {!joinedRoom && (
              <EmptyState
                icon="🎥"
                title="Camera not started"
                message="Join a room to start your camera."
              />
            )}
          </div>

          <div style={styles.videoCard}>
            <div style={styles.videoHeader}>
              <strong>Remote User</strong>
              <span>Trainer/Trainee</span>
            </div>

            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={styles.video}
            />

            {!joinedRoom && (
              <EmptyState
                icon="👤"
                title="No remote user"
                message="The other participant will appear here after joining the same room."
              />
            )}
          </div>
        </section>

        <section style={styles.controls}>
          <button
            type="button"
            onClick={toggleCamera}
            disabled={!joinedRoom}
            className="gs-button-outline"
          >
            {isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
          </button>

          <button
            type="button"
            onClick={toggleMic}
            disabled={!joinedRoom}
            className="gs-button-outline"
          >
            {isMicOn ? "Mute Mic" : "Unmute Mic"}
          </button>
        </section>

        <section style={styles.infoCard}>
          <p style={styles.kicker}>How to test</p>
          <p style={styles.muted}>
            Open the app in two browsers. Login as trainee in one and trainer in
            another. Both users must enter the exact same Room ID and click Join
            Video Call.
          </p>
        </section>
      </PageShell>
    </>
  );
}

const styles = {
  statusCard: {
    marginTop: 20,
    border: "1px solid #bbf7d0",
    borderRadius: 28,
    padding: 20,
    background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
  },
  joinCard: {
    marginTop: 20,
    display: "flex",
    gap: 12,
    alignItems: "end",
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 18,
    background: "#ffffff",
  },
  roomLabel: {
    flex: 1,
  },
  videoGrid: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  videoCard: {
    minHeight: 360,
    border: "1px solid #e2e8f0",
    borderRadius: 28,
    padding: 14,
    background: "#ffffff",
    boxShadow: "0 22px 60px rgba(15,23,42,0.08)",
    position: "relative",
    overflow: "hidden",
  },
  videoHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
    color: "#0f172a",
  },
  video: {
    width: "100%",
    minHeight: 300,
    borderRadius: 22,
    background: "#020617",
    objectFit: "cover",
  },
  controls: {
    marginTop: 18,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  infoCard: {
    marginTop: 22,
    border: "1px solid #e2e8f0",
    borderRadius: 26,
    padding: 18,
    background: "#f8fafc",
  },
  kicker: {
    margin: "0 0 6px",
    color: "#16a34a",
    fontWeight: 950,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontSize: 13,
  },
  title: {
    margin: 0,
    fontSize: 28,
    letterSpacing: "-0.045em",
  },
  muted: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.7,
  },
  error: {
    marginTop: 16,
    padding: "12px 14px",
    borderRadius: 16,
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: 800,
  },
};

export default VideoCall;