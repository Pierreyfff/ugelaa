FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go mod tidy

RUN CGO_ENABLED=0 GOOS=linux go build -o /planillas-backend

FROM alpine:3.19

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /planillas-backend .
COPY uploads ./uploads

RUN mkdir -p /app/uploads

EXPOSE 8080

CMD ["./planillas-backend"]