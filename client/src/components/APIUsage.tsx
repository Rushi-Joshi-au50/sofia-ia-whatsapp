import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function APIUsage() {
  const [baseUrl, setBaseUrl] = useState("");
  
  // Get the base URL for code examples
  useEffect(() => {
    const url = window.location.origin;
    setBaseUrl(url);
  }, []);
  
  // Handle copying the code examples
  const handleCopyJson = () => {
    const jsonExample = JSON.stringify({
      to: "5511987654321",
      message: "Hello from API!"
    }, null, 2);
    
    navigator.clipboard.writeText(jsonExample);
  };
  
  const handleCopyCurl = () => {
    const curlExample = `curl -X POST ${baseUrl}/api/send \\
  -H "Content-Type: application/json" \\
  -d '{"to":"5511987654321","message":"Hello!"}'`;
    
    navigator.clipboard.writeText(curlExample);
  };
  
  return (
    <Card>
      <CardHeader className="bg-primary-dark text-white p-5 rounded-t-lg flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium flex items-center">
          <span className="material-icons mr-2 text-xl">code</span>
          API Usage
        </CardTitle>
        <Button variant="link" className="text-white p-0 h-auto text-sm font-medium flex items-center">
          <span className="material-icons text-sm mr-1">description</span>
          Full Documentation
        </Button>
      </CardHeader>
      
      <CardContent className="p-5 border-t">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Send a message</h3>
          <div className="bg-neutral-100 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-neutral-500">POST /api/send</span>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-5 text-xs text-primary font-medium"
                onClick={handleCopyJson}
              >
                <span className="material-icons text-xs mr-1">content_copy</span>
                Copy
              </Button>
            </div>
            <pre className="code-block text-xs text-neutral-700 overflow-x-auto">
<code>{JSON.stringify({
  to: "5511987654321",
  message: "Hello from API!"
}, null, 2)}</code></pre>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-2">Example Request (cURL)</h3>
          <div className="bg-neutral-100 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-neutral-500">Terminal</span>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-5 text-xs text-primary font-medium"
                onClick={handleCopyCurl}
              >
                <span className="material-icons text-xs mr-1">content_copy</span>
                Copy
              </Button>
            </div>
            <pre className="code-block text-xs text-neutral-700 overflow-x-auto">
<code>{`curl -X POST ${baseUrl}/api/send \\
  -H "Content-Type: application/json" \\
  -d '{"to":"5511987654321","message":"Hello!"}'`}</code></pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
