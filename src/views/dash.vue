<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="bg-container">
    <div class="container">
      <div class="wrapper">
        <h1>Prova de participação</h1>
        <div class="card-list">
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
                    <p
                      class="status"
                      :class="getStatusClass(item.status)"
                    >
                      {{ item.status }}
                    </p>
                  </div>
                </div>
                <div v-else>
                  <div class="loading">
                    <img src="/check.png" alt="" />
                    <p
                      class="status"
                      :class="getStatusClass(item.status)"
                    >
                      {{ item.status }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="aside">
        <img src="/br.png" alt="" />
        <div class="aside-text">
          <p>Total de Registros: 411</p>
          <p>Registros pendentes: 1</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      items: [
        {
          id: 1,
          status: "Gravando na Blockchain",
          email: "usuario1@example.com",
          validationCode: "ADGF1234567890DO01",
          dateTime: "2024-10-15T04:17:00Z",
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
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
        {
          id: 4,
          status: "Prova permanente gravada",
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
        {
          id: 5,
          status: "Prova permanente gravada",
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
        {
          id: 6,
          status: "Prova permanente gravada",
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
        {
          id: 7,
          status: "Prova permanente gravada",
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
        {
          id: 8,
          status: "Prova permanente gravada",
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
        {
          id: 9,
          status: "Prova permanente gravada",
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
        {
          id: 10,
          status: "Prova permanente gravada",
          email: "usuario2@example.com",
          validationCode: "ADGF0987654321DO02",
          dateTime: "2024-10-14T12:15:00Z",
        },
      ],
    };
  },
  methods: {
    censorEmail(email) {
      const [user, domain] = email.split("@");
      const censoredUser = user.slice(0, 3) + "******";
      return `${censoredUser}@${domain}`;
    },
    censorCode(code) {
      return code.slice(0, 4) + "**********************" + code.slice(-4);
    },
    timeAgo(dateTime) {
      const now = new Date();
      const past = new Date(dateTime);
      const diffInSeconds = Math.floor((now - past) / 1000);

      const intervals = [
        { label: "ano", seconds: 31536000 },
        { label: "mês", seconds: 2592000 },
        { label: "dia", seconds: 86400 },
        { label: "hora", seconds: 3600 },
        { label: "minuto", seconds: 60 },
        { label: "segundo", seconds: 1 },
      ];

      for (const interval of intervals) {
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
          return `${count} ${interval.label}${count > 1 ? "s" : ""} atrás`;
        }
      }
      return "Agora mesmo";
    },
    getCardStyle(status) {
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
    },
    getTextStyle(status) {
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
    },
    getStatusClass(status) {
      if (status === "Gravando na Blockchain") {
        return "status-gravando";
      } else if (status === "Prova permanente gravada") {
        return "status-gravada";
      }
      return "";
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.cdnfonts.com/css/futura-ts-new");
@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css");
* {
  font-family: "Futura TS New", sans-serif;
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
</style>
