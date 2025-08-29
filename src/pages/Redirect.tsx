import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getLocationFromIP } from "@/utils/geoLocation";
import { Loader2 } from "lucide-react";

const Redirect = () => {
  const { qrId } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // Get QR code details
      const { data: qrCode, error: qrError } = await supabase
        .from("qr_codes")
        .select("*")
        .eq("id", qrId)
        .eq("is_active", true)
        .single();

      if (qrError || !qrCode) {
        throw new Error("QR code not found or inactive");
      }

      // Log the scan
      await logScan(qrCode.id);

      // Handle different QR types
      let redirectUrl = "";

      switch (qrCode.qr_type) {
        case "static":
        case "dynamic":
          redirectUrl = qrCode.destination_url || "";
          break;

        case "multi-url":
          redirectUrl = selectMultiUrl(qrCode.multi_urls);
          break;

        case "action":
          handleAction(qrCode.action_type, qrCode.action_data);
          return;

        case "geo":
          handleGeoRedirect(qrCode.geo_data);
          return;

        default:
          redirectUrl = qrCode.destination_url || "";
      }

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
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  const logScan = async (qrCodeId: string) => {
    try {
      // Get user's location and device info
      const userAgent = navigator.userAgent;
      const referrer = document.referrer;

      // Detect device type
      const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent)
        ? "mobile"
        : "desktop";

      // Get location from IP address
      const locationData = await getLocationFromIP();

      // Log the scan
      await supabase.from("qr_scan_logs").insert({
        qr_code_id: qrCodeId,
        user_agent: userAgent,
        device_type: deviceType,
        referrer: referrer || null,
        country: locationData.country,
        city: locationData.city,
      });
    } catch (error) {
      console.error("Failed to log scan:", error);
      // Don't block redirect if logging fails
    }
  };

  const selectMultiUrl = (multiUrls: any): string => {
    if (!multiUrls || !Array.isArray(multiUrls)) {
      return "";
    }

    // Handle weighted selection
    const totalWeight = multiUrls.reduce(
      (sum, url) => sum + (url.weight || 1),
      0
    );
    let random = Math.random() * totalWeight;

    for (const url of multiUrls) {
      random -= url.weight || 1;
      if (random <= 0) {
        return url.url;
      }
    }

    // Fallback to first URL
    return multiUrls[0]?.url || "";
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
          <p className="text-sm text-muted-foreground">
            This QR code may be inactive, expired, or invalid.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default Redirect;
