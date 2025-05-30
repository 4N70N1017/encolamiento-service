#!/bin/bash

URL="http://localhost:3000/encolar"
TOTAL_REQUESTS=300
CONCURRENCY=10
TMP_TASKS="taskids.txt"

# Limpia archivo temporal
> $TMP_TASKS

# Verifica si la URL es alcanzable (espera un 2xx o 3xx)
if ! curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"n":1}' "$URL" | grep -qE "2[0-9]{2}|3[0-9]{2}"; then
  echo "Error: No se puede alcanzar la URL $URL"
  exit 1
fi

# Verifica si TOTAL_REQUESTS es un entero positivo
if ! [[ "$TOTAL_REQUESTS" =~ ^[0-9]+$ ]] || [ "$TOTAL_REQUESTS" -le 0 ]; then
  echo "Error: El número total de solicitudes debe ser un entero positivo"
  exit 1
fi

echo "Enviando $TOTAL_REQUESTS solicitudes a $URL con concurrencia $CONCURRENCY..."

# Encola tareas y guarda los taskId
seq 1 $TOTAL_REQUESTS | xargs -P $CONCURRENCY -I {} \
  curl -s -X POST -H "Content-Type: application/json" \
  -d '{"n":80000}' $URL | jq -r .taskId >> $TMP_TASKS

echo "Esperando resultados de las tareas..."

# Función para esperar el resultado de una tarea
wait_for_task() {
  local taskId=$1
  while true; do
    estado=$(curl -s "$URL/status/$taskId" | jq -r .estado)
    if [[ "$estado" == "completada" || "$estado" == "error" ]]; then
      resultado=$(curl -s "$URL/status/$taskId")
      echo "Tarea $taskId terminada: $resultado"
      break
    fi
    sleep 1
  done
}

# Espera los resultados en paralelo
cat $TMP_TASKS | xargs -P $CONCURRENCY -I {} bash -c "wait_for_task {}"

# Limpia archivo temporal
rm $TMP_TASKS