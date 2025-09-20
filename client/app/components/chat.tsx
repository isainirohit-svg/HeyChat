"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as React from "react";

interface Doc {
  pageContent?: string;
  metdata?: {
    loc?: {
      pageNumber?: number;
    };
    source?: string;
  };
}
interface IMessage {
  role: "assistant" | "user";
  content?: string;
  documents?: Doc[];
}

const ChatComponent: React.FC = () => {
  const [message, setMessage] = React.useState<string>("");
  const [messages, setMessages] = React.useState<IMessage[]>([]);

  const handleSendChatMessage = async () => {
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setMessage("");

    // Call backend
    const res = await fetch(`http://localhost:8000/chat?message=${message}`);
    const data = await res.json();

    // Add assistant message
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data?.message,
        documents: data?.docs,
      },
    ]);

    // Append PDF names to input box if assistant sends documents
    if (data?.docs?.length > 0) {
      const docNames = data.docs
        .map((doc: Doc) => doc.metdata?.source?.split(" - ").pop())
        .filter(Boolean)
        .join(", ");
      setMessage(docNames);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-xl whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "assistant" && msg.documents && msg.documents.length > 0 && (
              <div className="mt-2 ml-2 border-l-4 border-purple-400 pl-3 text-sm text-gray-700 bg-gray-50 rounded">
                <div className="font-semibold mb-1">Referenced Documents:</div>
                {msg.documents.map((doc, i) => (
                  <div key={i} className="mb-2">
                    <div className="truncate max-w-md">
                      {doc.pageContent?.slice(0, 300)}
                      {doc.pageContent && doc.pageContent.length > 300 ? "..." : ""}
                    </div>
                    {doc.metdata?.loc?.pageNumber && (
                      <div className="text-xs text-gray-500">
                        Page: {doc.metdata.loc.pageNumber}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input box */}
      <div className="flex gap-3 w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendChatMessage();
          }}
          className="flex gap-3 w-full"
        >
          <Input
            className="flex-1"
            value={message}
            onChange={(e: any) => setMessage(e.target.value)}
            placeholder="Type your message here"
          />
          <Button type="submit" disabled={!message.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatComponent;
