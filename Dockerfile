# Static Markdown Lab Viewer for Google Cloud Run
FROM nginx:alpine

# Cloud Run expects the container to listen on port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Viewer app only (labs are loaded via ?lab= GitHub / raw Markdown URLs)
COPY index.html app.js style.css /usr/share/nginx/html/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
