import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceAssistantProps {
  ageGroup: "child" | "adult" | "senior";
}

const VoiceAssistant = ({ ageGroup }: VoiceAssistantProps) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Check if Web Speech API is supported
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  // Text-to-Speech functionality
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Adjust voice parameters based on age group
      if (ageGroup === "child") {
        utterance.pitch = 1.2;
        utterance.rate = 0.9;
      } else if (ageGroup === "senior") {
        utterance.pitch = 0.9;
        utterance.rate = 0.8;
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  // Speech-to-Text functionality (placeholder)
  const startListening = () => {
    if (!isSupported) {
      toast({
        title: "Voice not supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    setIsListening(true);

    // Simulate voice recognition with timeout
    setTimeout(() => {
      setIsListening(false);
      
      // Mock voice commands
      const mockCommands = [
        "Tell me about my diabetes risk",
        "How many steps did I take today?",
        "What are my health goals?",
        "Read my latest health recommendations"
      ];

      const randomCommand = mockCommands[Math.floor(Math.random() * mockCommands.length)];
      
      toast({
        title: "Voice command received",
        description: `"${randomCommand}"`,
      });

      // Respond based on the mock command
      setTimeout(() => {
        handleVoiceCommand(randomCommand);
      }, 1000);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceCommand = (command: string) => {
    let response = "";

    if (command.includes("diabetes risk")) {
      if (ageGroup === "child") {
        response = "Your health score looks good! Keep eating healthy foods and staying active!";
      } else if (ageGroup === "senior") {
        response = "Your diabetes risk is currently at 65 percent. Please continue following your care plan.";
      } else {
        response = "Your current diabetes risk is 65%. The main factors affecting this are your BMI and physical activity level. I recommend focusing on your daily step goals.";
      }
    } else if (command.includes("steps")) {
      if (ageGroup === "child") {
        response = "You've taken 8,500 steps today! Only 1,500 more to reach your goal! You can do it!";
      } else {
        response = "You've taken 8,500 steps today. You're 1,500 steps away from your 10,000 step goal.";
      }
    } else if (command.includes("goals")) {
      if (ageGroup === "child") {
        response = "Your missions today are: walk 10,000 steps, drink 8 glasses of water, and sleep 8 hours! You're doing great!";
      } else {
        response = "Your daily goals are 10,000 steps, 8 hours of sleep, and 8 glasses of water. You're currently at 85% completion.";
      }
    } else if (command.includes("recommendations")) {
      if (ageGroup === "child") {
        response = "The health coach says: drink more water, take a fun walk, and get good sleep tonight!";
      } else {
        response = "Your AI health coach recommends: increase your daily water intake by 2 glasses, take a 15-minute walk after dinner, and maintain consistent sleep schedule.";
      }
    } else {
      response = ageGroup === "child" 
        ? "I didn't understand that. Try asking about your steps, water, or sleep!"
        : "I'm here to help with your health questions. You can ask about your risk levels, daily goals, or health recommendations.";
    }

    speakText(response);
  };

  const getVoiceInstructions = () => {
    if (ageGroup === "child") {
      return "Tap the microphone and ask me about your health! 🎤";
    } else if (ageGroup === "senior") {
      return "Press the button and ask about your health";
    } else {
      return "Voice assistant ready - ask about your health metrics, goals, or recommendations";
    }
  };

  return (
    <div className="voice-widget">
      {/* Main Voice Button */}
      <Button
        size="sm"
        className={`w-full h-full rounded-full ${isListening ? 'listening' : ''}`}
        onClick={isListening ? stopListening : startListening}
        disabled={!isSupported}
      >
        {isListening ? (
          <MicOff className="h-6 w-6" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </Button>

      {/* Status Indicator */}
      {(isListening || isSpeaking) && (
        <div className="absolute -top-12 -left-20 bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center space-x-2">
            {isListening && (
              <>
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-primary rounded-full animate-pulse"></div>
                  <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-1 h-4 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                </div>
                <span className="text-xs text-primary font-medium">Listening...</span>
              </>
            )}
            {isSpeaking && (
              <>
                <Volume2 className="h-4 w-4 text-success" />
                <span className="text-xs text-success font-medium">Speaking...</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto p-1"
                  onClick={stopSpeaking}
                >
                  <VolumeX className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Instructions Tooltip */}
      {!isListening && !isSpeaking && (
        <div className="absolute -top-16 -left-32 bg-background border border-border rounded-lg px-3 py-2 shadow-lg max-w-64 opacity-0 hover:opacity-100 transition-opacity">
          <p className="text-xs text-muted-foreground text-center">
            {getVoiceInstructions()}
          </p>
          {!isSupported && (
            <Badge variant="destructive" className="text-xs mt-1">
              Not supported
            </Badge>
          )}
        </div>
      )}

      {/* Quick Actions for Voice Commands */}
      {ageGroup !== "child" && (
        <div className="absolute -top-32 -left-20 bg-background border border-border rounded-lg p-3 shadow-lg opacity-0 hover:opacity-100 transition-opacity">
          <p className="text-xs font-medium mb-2">Try saying:</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>"Tell me my diabetes risk"</p>
            <p>"How many steps today?"</p>
            <p>"What are my goals?"</p>
            <p>"Read my recommendations"</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;