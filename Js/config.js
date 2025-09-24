(function () {
  const DEFAULT_REMOTE_API = "https://api.raynucommunitytournament.xyz/api";
  const DEFAULT_REMOTE_SERVER = "https://api.raynucommunitytournament.xyz";
  const DEFAULT_STATIC_FALLBACK = "../api";
  const DEFAULT_ASSETS = {
    teamLogo: "../Image/team.png",
    casterPhoto: "../Image/caster.png",
    tournamentLogo: "../Image/logo.png",
  };

  const userConfig = window.__RAYNU_CONFIG__ || {};

  const mergedConfig = {
    apiBaseUrl:
      userConfig.apiBaseUrl !== undefined
        ? userConfig.apiBaseUrl
        : DEFAULT_REMOTE_API,
    serverBaseUrl:
      userConfig.serverBaseUrl !== undefined
        ? userConfig.serverBaseUrl
        : DEFAULT_REMOTE_SERVER,
    staticFallbackBaseUrl:
      userConfig.staticFallbackBaseUrl !== undefined
        ? userConfig.staticFallbackBaseUrl
        : DEFAULT_STATIC_FALLBACK,
    defaultAssets:
      typeof userConfig.defaultAssets === "object" &&
      userConfig.defaultAssets !== null
        ? { ...DEFAULT_ASSETS, ...userConfig.defaultAssets }
        : { ...DEFAULT_ASSETS },
  };

  const normalizeEndpoint = (endpoint) => {
    if (!endpoint) return "/";
    return endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  };

  mergedConfig.__lastSuccessfulSource = null;

  mergedConfig.resolveMediaUrl = (assetPath) => {
    if (!assetPath) return "";
    if (/^(data:|https?:)/i.test(assetPath)) return assetPath;

    const baseUrl = mergedConfig.serverBaseUrl || "";
    const trimmedBase = baseUrl.endsWith("/")
      ? baseUrl.slice(0, -1)
      : baseUrl;
    const isLocalAsset = /^\/(image|images|img|css|js|music|docs)\//i.test(
      assetPath
    );

    if (assetPath.startsWith("/")) {
      if (isLocalAsset || !trimmedBase) {
        return assetPath;
      }
      return `${trimmedBase}${assetPath}`;
    }

    if (!trimmedBase) {
      return assetPath;
    }

    return `${trimmedBase}/${assetPath}`;
  };

  mergedConfig.fetchApiData = async (endpoint) => {
    const normalized = normalizeEndpoint(endpoint);
    const attempts = [];

    if (mergedConfig.apiBaseUrl) {
      const apiBase = mergedConfig.apiBaseUrl.endsWith("/")
        ? mergedConfig.apiBaseUrl.slice(0, -1)
        : mergedConfig.apiBaseUrl;
      attempts.push({
        url: `${apiBase}${normalized}`,
        source: "remote",
      });
    }

    if (mergedConfig.staticFallbackBaseUrl) {
      const fallbackBase = mergedConfig.staticFallbackBaseUrl.endsWith("/")
        ? mergedConfig.staticFallbackBaseUrl.slice(0, -1)
        : mergedConfig.staticFallbackBaseUrl;
      const fileEndpoint = normalized.replace(/^\//, "");
      attempts.push({
        url: `${fallbackBase}/${fileEndpoint}.json`,
        source: "static",
      });
    }

    let lastError = null;
    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        mergedConfig.__lastSuccessfulSource = attempt.source;
        return data;
      } catch (error) {
        lastError = error;
        console.warn(`[Raynu API] Falló la solicitud a ${attempt.url}:`, error);
      }
    }

    throw lastError || new Error("No se pudo obtener información del API.");
  };

  window.__RAYNU_CONFIG__ = mergedConfig;
})();
