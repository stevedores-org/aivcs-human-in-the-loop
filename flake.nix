{
  description = "aivcs-human-in-the-loop — Human-in-the-loop UI for the agent-driven VCS";

  nixConfig = {
    extra-substituters = [ "https://nix-cache.stevedores.org" ];
    extra-trusted-public-keys = [
      "stevedores-1:ZEtb+wHYNR/LDmMDhF3/EpRZDNma8exY2b1TGZ6uS2A="
    ];
  };

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

        distPath =
          let
            fromEnv = builtins.getEnv "NIX_HITL_DIST";
          in
            if fromEnv != "" then
              builtins.path {
                path = fromEnv;
                name = "hitl-dist";
              }
            else if builtins.pathExists ./dist then ./dist
            else throw ''
              dist/ is missing. Build the Vite bundle before packaging OCI:
                bun install --frozen-lockfile
                bun run build
                NIX_HITL_DIST=$PWD/dist nix build .#oci --impure
            '';

        packages = {
          # Hermetic OCI tarball consumed by skopeo in CI. Frontend assets are
          # produced by `bun run build` in the workflow (networked) and then
          # copied into the image here (sandbox-safe, no Dockerfile).
          oci = pkgs.dockerTools.buildLayeredImage {
            name = "aivcs-human-in-the-loop";
            tag = "latest";
            maxLayers = 50;
            contents = with pkgs; [
              bun
              cacert
            ];
            extraCommands = ''
              mkdir -p app/dist app/scripts tmp
              chmod 1777 tmp
              cp -r ${distPath}/. app/dist/
              cp ${./scripts/serve-dist.ts} app/scripts/serve-dist.ts
            '';
            config = {
              Cmd = [ "${pkgs.bun}/bin/bun" "run" "/app/scripts/serve-dist.ts" ];
              User = "65532:65532";
              WorkingDir = "/app";
              ExposedPorts = {
                "3000/tcp" = { };
              };
              Labels = {
                "org.opencontainers.image.source" =
                  "https://github.com/stevedores-org/aivcs-human-in-the-loop";
                "org.opencontainers.image.title" = "aivcs-human-in-the-loop";
                "org.opencontainers.image.description" =
                  "Human-in-the-loop UI for aivcs — agent branches, PR diffs, intent threads, CI checks, audit trail.";
                "org.opencontainers.image.licenses" = "Apache-2.0";
                "lornu.ai/component" = "aivcs-human-in-the-loop";
                "lornu.ai/managed-by" = "nix-flake";
                "lornu.ai/runtime" = "bun";
                "lornu.ai/kind" = "frontend-spa";
              };
            };
          };
        };
      in
      {
        inherit packages;

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            bun
            nodejs_22
            skopeo
          ];
        };
      });
}
