import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Redirect = () => {
  const { qrId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!qrId) {
      setError("Invalid QR code");
      setLoading(false);
      return;
    }

    handleRedirect();
  }, [qrId]);

  const handleRedirect = async () => {
    try {
      // Get user's device info
      const userAgent = navigator.userAgent;
      const referrer = document.referrer;
      
      // Detect device type
      const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent)
        ? "mobile"
        : "desktop";

      // Call secure RPC function to resolve QR and log scan
      const { data: result, error } = await supabase.rpc('resolve_qr_and_log', {
        qr_id: qrId,
        user_agent: userAgent,
        device_type: deviceType,
        referrer: referrer || null,
        country: 'Unknown', // No longer using client-side geolocation
        city: 'Unknown'
      });

      if (error) {
        console.error('RPC error:', error);
        throw new Error("Unable to process QR code");
      }

      // Parse the result safely
      const response = result as any;
      
      if (response?.error) {
        throw new Error("QR code not found or inactive");
      }

      // Handle response based on type
      switch (response?.type) {
        case "link":
          let redirectUrl = response.url;
          if (redirectUrl) {
            // Add protocol if missing
            if (
              !redirectUrl.startsWith("http://") &&
              !redirectUrl.startsWith("https://")
            ) {
              redirectUrl = "https://" + redirectUrl;
            }
            window.location.href = redirectUrl;
          } else {
            throw new Error("No destination URL found");
          }
          break;

        case "action":
          handleAction(response.action_type, response.action_data);
          break;

        case "geo":
          handleGeoRedirect(response.geo_data);
          break;

        case "content":
          handleDirectContent(response.content_type, response.content);
          break;

        default:
          throw new Error("Unknown QR type");
      }
    } catch (error: any) {
      console.error('Redirect error:', error);
      setError("This QR code may be inactive, expired, or invalid.");
      setLoading(false);
    }
  };



  const handleAction = (actionType: string, actionData: any) => {
    switch (actionType) {
      case "email":
        const emailUrl = `mailto:${
          actionData.email
        }?subject=${encodeURIComponent(
          actionData.subject || ""
        )}&body=${encodeURIComponent(actionData.body || "")}`;
        window.location.href = emailUrl;
        break;

      case "phone":
        window.location.href = `tel:${actionData.phone}`;
        break;

      case "sms":
        window.location.href = `sms:${
          actionData.phone
        }?body=${encodeURIComponent(actionData.message || "")}`;
        break;

      default:
        setError("Unknown action type");
        setLoading(false);
    }
  };

  const handleGeoRedirect = (geoData: any) => {
    if (!geoData || (!geoData.latitude && !geoData.longitude)) {
      setError("Invalid location data");
      setLoading(false);
      return;
    }

    // Create Google Maps URL
    let mapsUrl = "";
    if (geoData.address) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        geoData.address
      )}`;
    } else if (geoData.latitude && geoData.longitude) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${geoData.latitude},${geoData.longitude}`;
    }

    if (mapsUrl) {
      window.location.href = mapsUrl;
    } else {
      setError("Unable to create location link");
      setLoading(false);
    }
  };

  const handleDirectContent = (qrType: string, content: string) => {
    if (!content) {
      setError("No content available");
      setLoading(false);
      return;
    }

    if (qrType === "vcard") {
      // For vCard, try to download or show content
      const blob = new Blob([content], { type: "text/vcard" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contact.vcf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success message
      setLoading(false);
      setError("Contact downloaded successfully!");
    } else if (qrType === "event") {
      // For event, try to download or show content
      const blob = new Blob([content], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "event.ics";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success message
      setLoading(false);
      setError("Event downloaded successfully!");
    } else if (qrType === "text") {
      // For text, show the content
      setLoading(false);
      setError(content); // We'll use the error state to show the text content
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            QR Code Error
          </h1>
          <p className="text-muted-foreground mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Redirect;
