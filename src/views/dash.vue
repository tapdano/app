<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="bg-container" ref="el">
    <div class="container">
      <div class="wrapper">
        <h1>Prova de Participação</h1>
        <div class="card-list">
          <transition-group name="list" tag="div">
            <div
              class="card mb-3"
              v-for="item in items"
              :key="item.id"
              :style="getCardStyle(item.status)"
            >
              <div class="row g-0">
                <div class="col-md-2 img-place">
                  <img
                    src="/proof.png"
                    class="img-fluid rounded-start"
                    alt="Prova de participação"
                  />
                </div>
                <div class="col-md-8">
                  <div class="card-body">
                    <h5 :style="getTextStyle(item.status)">
                      Participante: {{ censorEmail(item.email) }}<br />
                      Código Validador: {{ censorCode(item.validationCode) }}
                    </h5>
                    <p class="card-text">
                      <small :style="getTextStyle(item.status)">
                        {{ timeAgo(item.dateTime) }}
                      </small>
                    </p>
                  </div>
                </div>
                <div class="col-md-2">
                  <div v-if="item.status === 'Gravando na Blockchain'">
                    <div class="loading">
                      <div class="container-animation">
                        <div class="ball"></div>
                        <div class="ball"></div>
                        <div class="ball"></div>
                        <div class="ball"></div>
                        <div class="ball"></div>
                      </div>
                      <p class="status" :class="getStatusClass(item.status)">
                        {{ item.status }}
                      </p>
                    </div>
                  </div>
                  <div v-else>
                    <div class="loading">
                      <img src="/check.png" alt="" />
                      <p class="status" :class="getStatusClass(item.status)">
                        {{ item.status }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
      <div class="aside">
        <img src="/br.png" alt="" @click="toggle" />
        <div class="aside-text" @click="addCard">
          <p>Total de Registros: {{ totalRegistros }}</p>
          <p>Registros pendentes: {{ registrosPendentes }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed  } from 'vue';
import { format, register } from 'timeago.js';
import pt_BR from 'timeago.js/lib/lang/pt_BR';
import { useFullscreen } from '@vueuse/core'

register('pt_BR', pt_BR);

interface Item {
  id: number;
  status: string;
  email: string;
  validationCode: string;
  dateTime: string;
}

let items = ref<Item[]>([
  {
    id: 1,
    status: "Gravando na Blockchain",
    email: "usuario1@example.com",
    validationCode: "ADGF1234567890DO01",
    dateTime: "2024-10-15T17:00:00Z",
  },
  {
    id: 2,
    status: "Prova permanente gravada",
    email: "usuario2@example.com",
    validationCode: "ADGF0987654321DO02",
    dateTime: "2024-10-14T12:15:00Z",
  },
  {
    id: 3,
    status: "Prova permanente gravada",
    email: "usuario3@example.com",
    validationCode: "ADGF0987654321DO03",
    dateTime: "2024-10-14T12:15:00Z",
  },
  {
    id: 4,
    status: "Prova permanente gravada",
    email: "usuario3@example.com",
    validationCode: "ADGF0987654321DO03",
    dateTime: "2024-10-14T12:15:00Z",
  },
  {
    id: 5,
    status: "Prova permanente gravada",
    email: "usuario3@example.com",
    validationCode: "ADGF0987654321DO03",
    dateTime: "2024-10-14T12:15:00Z",
  },
  {
    id: 6,
    status: "Prova permanente gravada",
    email: "usuario3@example.com",
    validationCode: "ADGF0987654321DO03",
    dateTime: "2024-10-14T12:15:00Z",
  },
]);

function censorEmail(email: string): string {
  const [user, domain] = email.split("@");
  const censoredUser = user.slice(0, 3) + "******";
  return `${censoredUser}@${domain}`;
}

function censorCode(code: string): string {
  return code.slice(0, 4) + "**********************" + code.slice(-4);
}

function timeAgo(dateTime: string): string {
  return format(new Date(dateTime), 'pt_BR');
}

function getCardStyle(status: string): Record<string, string> {
  if (status === "Gravando na Blockchain") {
    return {
      backgroundColor: "rgba(255, 205, 6, 1)",
    };
  } else if (status === "Prova permanente gravada") {
    return {
      backgroundColor: "rgba(0, 140, 74, 1)",
    };
  }
  return {};
}

function getTextStyle(status: string): Record<string, string> {
  if (status === "Gravando na Blockchain") {
    return {
      color: "#000",
    };
  } else if (status === "Prova permanente gravada") {
    return {
      color: "#fff",
    };
  }
  return {};
}

function getStatusClass(status: string): string {
  if (status === "Gravando na Blockchain") {
    return "status-gravando";
  } else if (status === "Prova permanente gravada") {
    return "status-gravada";
  }
  return "";
}

function addCard() {
  const newId = items.value.length + 1;
  const newItem: Item = {
    id: newId,
    status: "Gravando na Blockchain",
    email: `usuario${newId}@example.com`,
    validationCode: `ADGF${Math.random().toString(36).substr(2, 10).toUpperCase()}DO${newId.toString().padStart(2, '0')}`,
    dateTime: new Date().toISOString(),
  };
  items.value.unshift(newItem);
  setTimeout(() => {
    newItem.status = "Prova permanente gravada";
  }, 5000);
}

const totalRegistros = computed(() => items.value.length);

const registrosPendentes = computed(() => {
  return items.value.filter(item => item.status === "Gravando na Blockchain").length;
});

 const el = ref(null);
const { toggle } = useFullscreen(el);

</script>

<style scoped>
@import url("https://fonts.cdnfonts.com/css/futura-ts-new");
@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css");
* {
  font-family: "Futura TS New", sans-serif;
}

::-webkit-scrollbar {
  display: none;
}

.container {
  display: flex;
  flex-direction: row;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.loading img {
  width: 32px !important;
}

.status {
  font-size: 24px;
  font-weight: 700;
  line-height: 29.77px;
  text-align: center;
}

.status-gravando {
  color: rgba(0, 140, 74, 1);
}

.status-gravada {
  color: rgba(255, 205, 6, 1);
}

.card-body {
  padding: 0px 0px 0px 40px;
  display: flex;
  flex-direction: column;
  gap: 46px;
}

.aside-text {
  font-size: 25px;
  font-weight: 700;
  color: #fff;
  line-height: 31px;
}

small {
  font-size: 24px;
  font-weight: 500;
}

.aside {
  margin-top: 135px;
  margin-left: 48px;
  display: flex;
  flex-direction: column;
  gap: 198px;
  width: 262px;
  position: absolute;
  right: 77px;
  top: 36px;
}

.card-list {
  overflow: scroll;
  width: 1050px;
  height: 588px;
}

.bg-container {
  background-color: rgba(12, 22, 50, 1);
  width: 100%;
  height: 100%;
}

.card {
  height: 180px;
  width: 1050px;
  padding: 20px;
}

.card img {
  width: 140px;
  border-radius: 6px;
}
.row.g-0 {
  align-items: center;
  flex-wrap: nowrap;
}
.img-place {
  width: 140px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

h5 {
  margin: 0px;
}

p {
  margin: 0px;
}

h1 {
  padding-top: 54px;
  padding-bottom: 31px;
  font-size: 64px;
  font-weight: 700;
  line-height: 79px;
  color: rgba(255, 255, 255, 1);
}

.container-animation {
  display: grid;
  grid-template-columns: repeat(5, 17px);
  gap: 2px;
  justify-content: center;
  align-items: center;
}

.ball {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  animation: wave 1.5s ease-in-out infinite;
  background-color: rgba(0, 140, 74, 1);
}

.ball:nth-child(2) {
  animation-delay: -0.2s;
}

.ball:nth-child(3) {
  animation-delay: -0.4s;
}

.ball:nth-child(4) {
  animation-delay: -0.6s;
}

.ball:nth-child(5) {
  animation-delay: -0.8s;
}

@keyframes wave {
  0%,
  100% {
    transform: translateY(10px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.container::before {
  content: "";
  background: url(/grafismo.png);
  width: 183px;
  height: 183px;
  position: absolute;
  right: 0px;
}

.list-enter-active {
  transition: all 0.5s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}
.list-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>
