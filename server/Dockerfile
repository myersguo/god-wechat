FROM alpine:3.13

RUN apk add ca-certificates

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
&& apk add --update --no-cache nodejs npm

WORKDIR /app

COPY package*.json /app/


# 安装正式依赖（不安装 devDependencies）
RUN npm config set registry https://mirrors.cloud.tencent.com/npm/
RUN npm install

COPY . /app


EXPOSE 3000

CMD ["npm", "start"]

