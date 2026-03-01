import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Download, ArrowRight } from "lucide-react";

export default function TemplateSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-3xl">
        <CardContent className="p-8 text-center space-y-5">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 mx-auto">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your template is ready to download. A confirmation has been sent to your email.
          </p>
          <p className="text-xs text-muted-foreground">
            Download links expire in 24 hours. Logged-in users can re-download anytime.
          </p>
          <div className="space-y-3 pt-2">
            <Link to="/templates">
              <Button variant="outline" className="w-full rounded-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full rounded-full bg-primary text-primary-foreground mt-2">
                Save your templates forever — Create Free Account
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
