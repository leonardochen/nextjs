// Integrate Deepgram

"use client";

// Import necessary modules and components
import { useEffect, useState, useRef } from "react";
import {
    LiveConnectionState,
    LiveTranscriptionEvent,
    LiveTranscriptionEvents,
    useDeepgram,
} from "@/app/components/DeepgramContextProvider";
import {
    MicrophoneEvents,
    MicrophoneState,
    useMicrophone,
} from "@/app/components/MicrophoneContextProvider";

// Declare a global interface to add the webkitSpeechRecognition property to the Window object
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

// Export the MicrophoneComponent function component
export default function MicrophoneComponent() {
  // State variables to manage recording status, completion, and transcript
  const [isRecording, setIsRecording] = useState(false);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [transcript, setTranscript] = useState("");

  // Reference to store the SpeechRecognition instance
  const recognitionRef = useRef<any>(null);


  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, microphoneState } = useMicrophone();
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();

  // Setup
  useEffect(() => {
      console.log("Mic setup")
      setupMicrophone();
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
      if (microphoneState === MicrophoneState.Ready) {
          connectToDeepgram({
              model: "nova-2",
              interim_results: true,
              smart_format: true,
              filler_words: true,
              utterance_end_ms: 3000,
          });
          console.log("Connected to Deepgram")
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  useEffect(() => {
      if (!microphone) return;
      if (!connection) return;
      if (!isRecording) return;

      const onData = (e: BlobEvent) => {
          // iOS SAFARI FIX:
          // Prevent packetZero from being sent. If sent at size 0, the connection will close. 
          if (e.data.size > 0) {
              connection?.send(e.data);
          }
      };

      const onTranscript = (data: LiveTranscriptionEvent) => {
          const { is_final: isFinal, speech_final: speechFinal } = data;
          let thisCaption = data.channel.alternatives[0].transcript;

          console.log("thisCaption", thisCaption);
          if (thisCaption !== "") {
              console.log('thisCaption !== ""', thisCaption);
              setTranscript(thisCaption);
          }

          if (isFinal && speechFinal) {
              clearTimeout(captionTimeout.current);
              captionTimeout.current = setTimeout(() => {
                  setTranscript("");
                  clearTimeout(captionTimeout.current);
              }, 3000);
          }
      };

      if (connectionState === LiveConnectionState.OPEN) {
          connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
          microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

          startMicrophone();
      }

      return () => {
          // prettier-ignore
          connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
          microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
          clearTimeout(captionTimeout.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState, isRecording]);

  // Keep alive
  useEffect(() => {
      if (!connection) return;

      if (
          microphoneState !== MicrophoneState.Open &&
          connectionState === LiveConnectionState.OPEN
      ) {
          connection.keepAlive();

          keepAliveInterval.current = setInterval(() => {
              connection.keepAlive();
          }, 10000);
      } else {
          clearInterval(keepAliveInterval.current);
      }

      return () => {
          clearInterval(keepAliveInterval.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState]);









  // Function to start recording
  const startRecording = () => {
    setIsRecording(true);

    if (recognitionRef.current) {
      console.log("Recording already exists");
    }

    // Create a new SpeechRecognition instance and configure it
    recognitionRef.current = new window.webkitSpeechRecognition();
    recognitionRef.current.lang = "en-US";
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    console.log("Speech recognition instance created");

    // Event handler for speech recognition results
    recognitionRef.current.onresult = (event: any) => {
      const { transcript } = event.results[event.results.length - 1][0];

      // Log the recognition results and update the transcript state
      console.log(event.results);
      setTranscript(transcript);
    };

    recognitionRef.current.onstart = function() { console.log("onstart"); };
    recognitionRef.current.onresult = function() { console.log("onresult"); };
    recognitionRef.current.onerror = function() { console.log("onerror"); };
    recognitionRef.current.addEventListener("audioend", () => { console.log("audioend") });
    recognitionRef.current.addEventListener("audiostart", () => {console.log("audiostart")});
    recognitionRef.current.addEventListener("end", () => {console.log("end")});
    recognitionRef.current.addEventListener("error", (e:any) => {console.log("error"+e.error+e.message)});
    recognitionRef.current.addEventListener("nomatch", () => {console.log("nomatch")});
    recognitionRef.current.addEventListener("result", (e:any) => {console.log("result: "+e.results[(e.results.length-1)][0].transcript)});
    recognitionRef.current.addEventListener("soundend", () => {console.log("soundend")});
    recognitionRef.current.addEventListener("soundstart", () => {console.log("soundstart")});
    recognitionRef.current.addEventListener("speechend", () => {console.log("speechend")});
    recognitionRef.current.addEventListener("speechstart", () => {console.log("speechstart")});
    recognitionRef.current.addEventListener("start", () => {console.log("start")});


    // Start the speech recognition
    recognitionRef.current.start();
    console.log("Recording started");
  };

  // Cleanup effect when the component unmounts
  useEffect(() => {
    console.log("Component mounted");
    return () => {
      // Stop the speech recognition if it's active
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        console.log("Recording stopped");
      }
      console.log("Component unmounted");
    };
  }, []);

  // Function to stop recording
  const stopRecording = () => {
    if (recognitionRef.current) {
      // Stop the speech recognition and mark recording as complete
      recognitionRef.current.stop();
      console.log("Recording stopped");
      setRecordingComplete(true);
    }
  };

  // Toggle recording state and manage recording actions
  const handleToggleRecording = () => {
    console.log("Recording toggled");
    setIsRecording(!isRecording);
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // Render the microphone component with appropriate UI based on recording state
  return (            
    <div className="flex items-center justify-center h-screen w-full">
      <div className="w-full">
        {(isRecording || transcript) && (
          <div className="w-1/4 m-auto rounded-md border p-4 bg-white">
            <div className="flex-1 flex w-full justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  {recordingComplete ? "Recorded" : "Recording"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {recordingComplete
                    ? "Thanks for talking."
                    : "Start speaking..."}
                </p>
              </div>
              {isRecording && (
                <div className="rounded-full w-4 h-4 bg-red-400 animate-pulse" />
              )}
            </div>

            {transcript && (
              <div className="border rounded-md p-2 h-fullm mt-4">
                <p className="mb-0">{transcript}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center w-full">
          {isRecording ? (
            // Button for stopping recording
            <button
              onClick={handleToggleRecording}
              className="mt-10 m-auto flex items-center justify-center bg-red-400 hover:bg-red-500 rounded-full w-20 h-20 focus:outline-none"
            >
              <svg
                className="h-12 w-12 "
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="white" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            </button>
          ) : (
            // Button for starting recording
            <button
              onClick={handleToggleRecording}
              className="mt-10 m-auto flex items-center justify-center bg-blue-400 hover:bg-blue-500 rounded-full w-20 h-20 focus:outline-none"
            >
              <svg
                viewBox="0 0 256 256"
                xmlns="http://www.w3.org/2000/svg"
                className="w-12 h-12 text-white"
              >
                <path
                  fill="currentColor" // Change fill color to the desired color
                  d="M128 176a48.05 48.05 0 0 0 48-48V64a48 48 0 0 0-96 0v64a48.05 48.05 0 0 0 48 48ZM96 64a32 32 0 0 1 64 0v64a32 32 0 0 1-64 0Zm40 143.6V232a8 8 0 0 1-16 0v-24.4A80.11 80.11 0 0 1 48 128a8 8 0 0 1 16 0a64 64 0 0 0 128 0a8 8 0 0 1 16 0a80.11 80.11 0 0 1-72 79.6Z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
