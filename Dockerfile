FROM node:0.12-onbuild


ENV PROXY_HTTP_PORT=80 PROXY_HTTPS_PORT=443 PROXY_ADMIN_PORT=8888


EXPOSE 80 443 8888
