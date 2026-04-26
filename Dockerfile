# Используем официальный, сверхлегкий образ веб-сервера Nginx
FROM nginx:alpine

# Копируем твои 3 файла (html, css, js) в папку, откуда Nginx раздает сайты
COPY . /usr/share/nginx/html

# Открываем 80-й порт наружу
EXPOSE 80
