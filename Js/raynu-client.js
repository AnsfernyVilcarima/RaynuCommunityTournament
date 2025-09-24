(function (global) {
  const DEFAULT_ASSETS = {
    teamLogo: "../Image/team.png",
    casterPhoto: "../Image/caster.png",
    tournamentLogo: "../Image/logo.png",
  };

  const safeConfig = () => global.__RAYNU_CONFIG__ || {};

  const ensureFunction = (maybeFn, fallback) =>
    typeof maybeFn === "function" ? maybeFn : fallback;

  const normalizePath = (path, { allowEmpty = false } = {}) => {
    if (!path) return allowEmpty ? "" : "/";
    return path.startsWith("/") ? path : `/${path}`;
  };

  const fallbackResolver = (assetPath) => assetPath || "";

  const fallbackFetch = async (endpoint) => {
    const config = safeConfig();

    const attempts = [];
    const apiBaseUrl =
      typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim();
    const staticBaseUrl =
      typeof config.staticFallbackBaseUrl === "string" &&
      config.staticFallbackBaseUrl.trim();

    if (apiBaseUrl) {
      const base = apiBaseUrl.endsWith("/")
        ? apiBaseUrl.slice(0, -1)
        : apiBaseUrl;
      attempts.push({
        url: `${base}${normalizePath(endpoint)}`,
        source: "remote",
      });
    }

    if (staticBaseUrl) {
      const base = staticBaseUrl.endsWith("/")
        ? staticBaseUrl.slice(0, -1)
        : staticBaseUrl;
      const fileEndpoint = normalizePath(endpoint, { allowEmpty: true })
        .replace(/^\//, "")
        .replace(/\.json$/i, "");
      attempts.push({
        url: `${base}/${fileEndpoint}.json`,
        source: "static",
      });
    }

    if (attempts.length === 0) {
      attempts.push({ url: endpoint, source: "direct" });
    }

    let lastError = null;
    for (const attempt of attempts) {
      try {
        const response = await fetch(attempt.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (config) {
          config.__lastSuccessfulSource = attempt.source;
        }
        return data;
      } catch (error) {
        lastError = error;
        console.warn(
          `[RaynuClient] Falló la solicitud a ${attempt.url}:`,
          error
        );
      }
    }

    throw lastError || new Error("No se pudo obtener información del API.");
  };

  const getConfigDefaultAsset = (key) => {
    const config = safeConfig();
    const fromConfig =
      config.defaultAssets && typeof config.defaultAssets === "object"
        ? config.defaultAssets[key]
        : undefined;
    return fromConfig || DEFAULT_ASSETS[key] || "";
  };

  const resolveMediaUrl = (assetPath) =>
    ensureFunction(safeConfig().resolveMediaUrl, fallbackResolver)(assetPath);

  const getDefaultAsset = (key) => getConfigDefaultAsset(key);

  const withDefault = (assetPath, key) => {
    const resolved = assetPath ? resolveMediaUrl(assetPath) : "";
    const fallback = getDefaultAsset(key);
    return resolved || fallback;
  };

  const getApiBaseUrl = () => {
    const config = safeConfig();
    const rawBase =
      typeof config.apiBaseUrl === "string" && config.apiBaseUrl.trim();
    return rawBase || "https://api.raynucommunitytournament.xyz/api";
  };

  const buildApiUrl = (endpoint = "") => {
    const base = getApiBaseUrl();
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    if (!endpoint) return normalizedBase;
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    return `${normalizedBase}${normalizedEndpoint}`;
  };

  global.RaynuClient = {
    getConfig: () => safeConfig(),
    fetchApiData: (endpoint) =>
      ensureFunction(safeConfig().fetchApiData, fallbackFetch)(endpoint),
    resolveMediaUrl,
    getDefaultAsset,
    withDefault,
    buildApiUrl,
    getApiBaseUrl,
    get defaults() {
      const config = safeConfig();
      const configuredDefaults =
        config.defaultAssets && typeof config.defaultAssets === "object"
          ? config.defaultAssets
          : {};
      return { ...DEFAULT_ASSETS, ...configuredDefaults };
    },
  };
})(window);
