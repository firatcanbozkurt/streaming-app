
FROM node:18
WORKDIR /app
RUN npm install -g @angular/cli@17
COPY package*.json ./
RUN npm install

# I have used spartan-ng as a UI library
RUN npm i -D @spartan-ng/cli 
COPY . .
EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0"]
