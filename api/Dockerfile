FROM golang:1.26-alpine AS builder

# Instalar dependencias necesarias para CGO
RUN apk add --no-cache gcc musl-dev git

WORKDIR /app

# Copia go.mod primero
COPY go.mod ./

# Copia todo el código
COPY . .

# Descarga dependencias y genera go.sum (necesita el código para descubrir importaciones)
RUN go get ./...

# Compila
RUN CGO_ENABLED=1 GOOS=linux go build -o main .

FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copia el binario desde la etapa anterior
COPY --from=builder /app/main .

EXPOSE 8080

ENV PORT=8080
# Nota: Es mejor pasar estas variables en el docker-compose.yml, no aquí
ENV DATABASE_URL=${DATABASE_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}

CMD ["./main"]
