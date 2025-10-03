<template>
  <ion-page>
    <ion-content class="admin-content">
      <div class="admin-container">
        <!-- Header -->
        <div class="admin-header">
          <h1>🔧 Admin Panel - Seed Vault</h1>
          <div class="env-selector">
            <ion-segment v-model="selectedEnv" @ionChange="handleEnvChange">
              <ion-segment-button value="0">
                <ion-label>DEV</ion-label>
              </ion-segment-button>
              <ion-segment-button value="1">
                <ion-label>PROD</ion-label>
              </ion-segment-button>
            </ion-segment>
          </div>
        </div>

        <!-- Error/Success Messages -->
        <ion-card v-if="errorMessage" color="danger" class="message-card">
          <ion-card-content>{{ errorMessage }}</ion-card-content>
        </ion-card>
        <ion-card v-if="successMessage" color="success" class="message-card">
          <ion-card-content>{{ successMessage }}</ion-card-content>
        </ion-card>

        <!-- Table Selector -->
        <ion-card class="selector-card">
          <ion-card-header>
            <ion-card-title>Select Table</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-segment v-model="selectedTable" @ionChange="handleTableChange">
              <ion-segment-button value="SV_TAG">
                <ion-label>Tags</ion-label>
              </ion-segment-button>
              <ion-segment-button value="SV_EVENT">
                <ion-label>Events</ion-label>
              </ion-segment-button>
              <ion-segment-button value="SV_SORTEIO">
                <ion-label>Lottery</ion-label>
              </ion-segment-button>
            </ion-segment>
          </ion-card-content>
        </ion-card>

        <!-- Filters & Actions -->
        <ion-card class="filters-card">
          <ion-card-header>
            <ion-card-title>Filters & Actions</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="filters-row">
              <ion-item class="filter-item">
                <ion-label position="floating">Filter by field</ion-label>
                <ion-select v-model="filterField" placeholder="Select field">
                  <ion-select-option v-for="field in tableFields" :key="field" :value="field">
                    {{ field }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              
              <ion-item class="filter-item">
                <ion-label position="floating">Filter value</ion-label>
                <ion-input v-model="filterValue" placeholder="Enter value"></ion-input>
              </ion-item>

              <ion-item class="filter-item">
                <ion-label position="floating">Sort by</ion-label>
                <ion-select v-model="sortBy" placeholder="Select field">
                  <ion-select-option v-for="field in tableFields" :key="field" :value="field">
                    {{ field }}
                  </ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item class="filter-item">
                <ion-label position="floating">Sort order</ion-label>
                <ion-select v-model="sortOrder">
                  <ion-select-option value="asc">Ascending</ion-select-option>
                  <ion-select-option value="desc">Descending</ion-select-option>
                </ion-select>
              </ion-item>
            </div>

            <div class="action-buttons">
              <ion-button @click="loadItems" :disabled="isLoading">
                <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                Refresh
              </ion-button>
              <ion-button @click="clearFilters" fill="outline">
                <ion-icon :icon="closeOutline" slot="start"></ion-icon>
                Clear Filters
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Items List -->
        <ion-card class="items-card">
          <ion-card-header>
            <ion-card-title>
              Items ({{ items.length }})
              <ion-spinner v-if="isLoading" name="crescent"></ion-spinner>
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div v-if="items.length === 0 && !isLoading" class="empty-state">
              <ion-icon :icon="documentTextOutline" class="empty-icon"></ion-icon>
              <p>No items found</p>
            </div>

            <div v-else class="items-table-container">
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Actions</th>
                    <th v-for="field in tableFields" :key="field">{{ field }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in items" :key="item.id">
                    <td class="actions-cell">
                      <ion-button size="small" @click="editItem(item)">
                        <ion-icon :icon="createOutline"></ion-icon>
                      </ion-button>
                      <ion-button size="small" color="danger" @click="confirmDelete(item)">
                        <ion-icon :icon="trashOutline"></ion-icon>
                      </ion-button>
                    </td>
                    <td v-for="field in tableFields" :key="field" :class="{'id-cell': field === 'id'}">
                      <span v-if="typeof item[field] === 'boolean'">
                        {{ item[field] ? '✓' : '✗' }}
                      </span>
                      <span v-else-if="field === 'created_at' || field === 'last_otp_at' || field === 'data_cadastro'">
                        {{ formatDate(item[field]) }}
                      </span>
                      <span v-else>{{ formatValue(item[field]) }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Edit Modal -->
        <ion-modal :is-open="isEditModalOpen" @didDismiss="closeEditModal">
          <ion-header>
            <ion-toolbar>
              <ion-title>Edit Item</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="closeEditModal">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div v-if="editingItem" class="edit-form">
              <ion-item v-for="field in tableFields" :key="field" class="edit-field">
                <ion-label position="stacked">{{ field }}</ion-label>
                <ion-input
                  v-if="typeof editingItem[field] === 'string' || typeof editingItem[field] === 'number'"
                  v-model="editingItem[field]"
                  :readonly="field === 'id'"
                ></ion-input>
                <ion-toggle
                  v-else-if="typeof editingItem[field] === 'boolean'"
                  v-model="editingItem[field]"
                ></ion-toggle>
                <ion-input
                  v-else
                  :value="JSON.stringify(editingItem[field])"
                  readonly
                ></ion-input>
              </ion-item>

              <ion-button expand="block" @click="saveItem" :disabled="isSaving" class="save-button">
                <ion-spinner v-if="isSaving" name="crescent" slot="start"></ion-spinner>
                <ion-icon v-else :icon="saveOutline" slot="start"></ion-icon>
                Save Changes
              </ion-button>
            </div>
          </ion-content>
        </ion-modal>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonToggle,
  alertController
} from '@ionic/vue';
import {
  refreshOutline,
  closeOutline,
  documentTextOutline,
  createOutline,
  trashOutline,
  saveOutline
} from 'ionicons/icons';
import { ApiService } from '@/utils/ApiService';
import { AppConfigStorageService } from '@/utils/storage-services/AppConfigStorageService';

const appConfigService = new AppConfigStorageService();

// Auth
const devToken = ref('');

// State
const selectedEnv = ref('0'); // 0 = DEV, 1 = PROD
const selectedTable = ref('SV_TAG');
const items = ref<any[]>([]);
const isLoading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Filters
const filterField = ref('');
const filterValue = ref('');
const sortBy = ref('created_at');
const sortOrder = ref<'asc' | 'desc'>('desc');

// Edit
const isEditModalOpen = ref(false);
const editingItem = ref<any>(null);
const isSaving = ref(false);

// Table schemas
const tableSchemas: Record<string, string[]> = {
  SV_TAG: ['id', 'email', 'pin', 'physical_id', 'is_started', 'is_virtual', 'is_email_verified', 
           'created_at', 'last_otp_code', 'last_otp_at', 'otp_success_count', 'otp_fail_count',
           'version', 'event_id', 'platform', 'device_model', 'device_manufacturer', 
           'app_version', 'os_version', 'device_id'],
  SV_EVENT: ['id', 'name', 'description', 'start_date', 'end_date', 'passcode', 'created_at'],
  SV_SORTEIO: ['id', 'event_id', 'tag_id', 'email', 'data_cadastro']
};

const tableFields = computed(() => {
  return tableSchemas[selectedTable.value] || [];
});

onMounted(async () => {
  try {
    const token = await appConfigService.getDevToken();
    if (!token) {
      errorMessage.value = 'No devToken found. Please configure it in Settings first.';
      return;
    }
    devToken.value = token;
    await loadItems();
  } catch (error) {
    console.error('Error loading devToken:', error);
    errorMessage.value = 'Error loading devToken from Settings';
  }
});

const handleEnvChange = () => {
  loadItems();
};

const handleTableChange = () => {
  clearFilters();
  loadItems();
};

const clearFilters = () => {
  filterField.value = '';
  filterValue.value = '';
  sortBy.value = 'created_at';
  sortOrder.value = 'desc';
};

const loadItems = async () => {
  if (!devToken.value) return;
  
  isLoading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const filter = filterField.value && filterValue.value
      ? { [filterField.value]: filterValue.value }
      : {};

    const result = await ApiService.adminListItems(
      selectedTable.value,
      parseInt(selectedEnv.value),
      devToken.value,
      filter,
      sortBy.value,
      sortOrder.value
    ) as any;

    items.value = result.items || [];
    successMessage.value = `Loaded ${items.value.length} items`;
    setTimeout(() => { successMessage.value = ''; }, 3000);
  } catch (error: any) {
    errorMessage.value = 'Error loading items: ' + (error.message || error);
    items.value = [];
  } finally {
    isLoading.value = false;
  }
};

const editItem = (item: any) => {
  editingItem.value = { ...item };
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
  editingItem.value = null;
};

const saveItem = async () => {
  if (!editingItem.value || !devToken.value) return;

  isSaving.value = true;
  errorMessage.value = '';

  try {
    await ApiService.adminUpdateItem(
      selectedTable.value,
      parseInt(selectedEnv.value),
      devToken.value,
      editingItem.value
    );

    successMessage.value = 'Item updated successfully';
    closeEditModal();
    await loadItems();
  } catch (error: any) {
    errorMessage.value = 'Error updating item: ' + (error.message || error);
  } finally {
    isSaving.value = false;
  }
};

const confirmDelete = async (item: any) => {
  const alert = await alertController.create({
    header: 'Confirm Delete',
    message: `Are you sure you want to delete this item? ID: ${item.id}`,
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Delete',
        role: 'destructive',
        handler: () => deleteItem(item.id)
      }
    ]
  });

  await alert.present();
};

const deleteItem = async (itemId: string) => {
  if (!devToken.value) return;

  errorMessage.value = '';
  
  try {
    await ApiService.adminDeleteItem(
      selectedTable.value,
      parseInt(selectedEnv.value),
      devToken.value,
      itemId
    );

    successMessage.value = 'Item deleted successfully';
    await loadItems();
  } catch (error: any) {
    errorMessage.value = 'Error deleting item: ' + (error.message || error);
  }
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString();
  } catch {
    return dateStr;
  }
};
</script>

<style scoped>
.admin-content {
  --background: #f5f5f5;
}

.admin-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.env-selector {
  width: 200px;
}

.message-card {
  margin-bottom: 16px;
}

.selector-card,
.filters-card,
.items-card {
  margin-bottom: 20px;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-item {
  --background: white;
  --color: #000;
}

.filter-item ion-input,
.filter-item ion-select {
  --color: #000;
  color: #000;
}

.filter-item ion-label {
  color: #666;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.items-table-container {
  overflow-x: auto;
  max-height: 600px;
  overflow-y: auto;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.items-table thead {
  position: sticky;
  top: 0;
  background: #f0f0f0;
  z-index: 10;
}

.items-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
  white-space: nowrap;
}

.items-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.id-cell {
  font-family: monospace;
  font-size: 11px;
  color: #666;
}

.actions-cell {
  white-space: nowrap;
}

.actions-cell ion-button {
  margin: 0 4px;
}

.edit-form {
  max-width: 600px;
}

.edit-field {
  margin-bottom: 16px;
  --background: white;
  --color: #000;
}

.edit-field ion-input,
.edit-field ion-toggle {
  --color: #000;
  color: #000;
}

.edit-field ion-label {
  color: #666;
}

.save-button {
  margin-top: 24px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .admin-content {
    --background: #1a1a1a;
  }

  .admin-header {
    background: #2a2a2a;
  }

  .admin-header h1 {
    color: #fff;
  }

  .items-table thead {
    background: #2a2a2a;
  }

  .items-table th {
    color: #fff;
    border-bottom-color: #444;
  }

  .items-table td {
    border-bottom-color: #333;
  }
}
</style>

