import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSocket } from "@/lib/socket-raw";
import { sendMessage } from "@/lib/whatsapp";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function MessageSender() {
  const { connectionState } = useSocket();
  const { isConnected } = connectionState;
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: `Message sent to ${recipient}`,
        });
        // Clear message field after successful send
        setMessage("");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send message",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: "Error",
        description: "You must connect to WhatsApp first",
        variant: "destructive",
      });
      return;
    }
    
    if (!recipient || !message) {
      toast({
        title: "Error",
        description: "Recipient and message are required",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate({
      to: recipient,
      message,
    });
  };
  
  // Validate and format phone number
  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setRecipient(value);
  };
  
  return (
    <Card>
      <CardHeader className="bg-primary-dark text-white p-5 rounded-t-lg flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="material-icons mr-2 text-xl">send</span>
          Send Message
        </CardTitle>
        <div>
          {!isConnected && (
            <span className="text-xs text-error">Connection required</span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-5 border-t">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="recipient" className="block text-sm font-medium text-neutral-600 mb-1">
              Recipient Phone Number
            </label>
            <Input
              id="recipient"
              value={recipient}
              onChange={handlePhoneInput}
              placeholder="5511987654321"
              className="w-full"
              required
            />
            <p className="mt-1 text-xs text-neutral-500">
              Enter number with country code, without '+' or special characters
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-neutral-600 mb-1">
              Message
            </label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Type your message here..."
              className="w-full resize-none"
              required
            />
          </div>
          
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary text-white"
              disabled={!isConnected || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <>
                  <span className="material-icons text-sm mr-1 animate-spin">refresh</span>
                  Sending...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm mr-1">send</span>
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
