export default function ConnectionFailureTemplate({ source }: { source: string }) {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isOpenCerts = hostname === "opencerts.io" || hostname.endsWith(".opencerts.io");

  if (isOpenCerts) {
    return (
      <div style={{ marginRight: "auto", marginLeft: "auto", fontFamily: "Arial", wordBreak: "break-all" }}>
        <div style={{ backgroundColor: "#FDFDEA", borderLeft: "2px solid #8E4B10", padding: "16px 16px 16px 18px" }}>
          <p style={{ margin: "0px", lineHeight: "21px", fontSize: "16px", color: "#8E4B10", fontWeight: "700" }}>
            This document might be having loading issues
          </p>
          <p style={{ margin: "0px", lineHeight: "21px", fontSize: "14px", color: "#374151", marginTop: "6px" }}>
            Try refreshing the page or check your internet connection. If the issue continues, please contact the issuer with the information below:
            <br />
            <br />
            <span style={{ fontFamily: "Courier" }}>Template URL: &quot;{source}&quot;</span>
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <h3>Connection timeout on renderer</h3>
      <p>Please contact the administrator of {source}.</p>
    </>
  );
}
