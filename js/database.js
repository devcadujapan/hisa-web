// Banco de dados local (IndexedDB)
console.log('📦 database.js carregado!');

class LocalDatabase {
    constructor() {
        this.dbName = 'HisaDB';
        this.version = 5;
        this.db = null;
        this.ready = false;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Erro ao abrir banco:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                this.ready = true;
                console.log('✅ Banco de dados local conectado');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('atendimentos')) {
                    const store = db.createObjectStore('atendimentos', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('data', 'data', { unique: false });
                    console.log('✅ Tabela atendimentos criada');
                }
                
                if (!db.objectStoreNames.contains('reposicoes')) {
                    const store = db.createObjectStore('reposicoes', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('data', 'data', { unique: false });
                    console.log('✅ Tabela reposicoes criada');
                }
                
                if (!db.objectStoreNames.contains('despesas')) {
                    const store = db.createObjectStore('despesas', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('data', 'data', { unique: false });
                    console.log('✅ Tabela despesas criada');
                }
            };
        });
    }

    async add(storeName, data) {
        if (!this.ready) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => {
                console.log(`✅ Adicionado em ${storeName}:`, data);
                resolve(request.result);
            };
            request.onerror = () => {
                console.error(`Erro ao adicionar em ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    async getAll(storeName) {
        if (!this.ready) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
                console.log(`✅ Buscados ${request.result.length} registros de ${storeName}`);
                resolve(request.result || []);
            };
            request.onerror = () => {
                console.error(`Erro ao buscar ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    async getAllOrdered(storeName) {
        const items = await this.getAll(storeName);
        return items.sort((a, b) => b.data.localeCompare(a.data));
    }

    async update(storeName, id, newData) {
        if (!this.ready) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
                const oldData = request.result;
                if (!oldData) {
                    reject(new Error('Registro não encontrado'));
                    return;
                }
                const updatedData = { ...oldData, ...newData };
                const updateRequest = store.put(updatedData);
                updateRequest.onsuccess = () => {
                    console.log(`✅ Atualizado em ${storeName}:`, updatedData);
                    resolve(updatedData);
                };
                updateRequest.onerror = () => reject(updateRequest.error);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        if (!this.ready) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
                console.log(`✅ Deletado de ${storeName}: id ${id}`);
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        if (!this.ready) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log(`✅ Limpa ${storeName}`);
                resolve();
            };
            request.onerror = () => {
                console.error(`Erro ao limpar ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    async getSummary() {
        if (!this.ready) await this.init();
        const atendimentos = await this.getAll('atendimentos');
        const reposicoes = await this.getAll('reposicoes');
        const despesas = await this.getAll('despesas');
        
        // Soma apenas os valores corretos
        const totalEntradas = atendimentos.reduce((sum, a) => sum + (a.valor || 0), 0);
        const totalReposicoes = reposicoes.reduce((sum, r) => sum + (r.valor_total || r.valor || 0), 0);
        const totalDespesas = despesas.reduce((sum, d) => sum + (d.valor || 0), 0);
        const totalSaidas = totalReposicoes + totalDespesas;
        
        console.log('📊 Summary calculado:', { totalEntradas, totalReposicoes, totalDespesas, totalSaidas });
        
        return {
            entradas: totalEntradas,
            saidas: totalSaidas,
            saldo: totalEntradas - totalSaidas,
            reposicoes: totalReposicoes,
            despesas: totalDespesas
        };
    }

const db = new LocalDatabase();
console.log('📦 Instância do banco criada');