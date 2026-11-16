import app from "../src/app.js"
import request from "supertest"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { clearDatabase } from "./utils/clearDatabase.js"
import { MontadoraFactory } from "./factories/MontadoraFactory.js"
import { ClienteFactory } from "./factories/ClienteFactory.js"
import { VeiculoFactory } from "./factories/VeiculoFactory.js"
import { consultarCep } from "../src/utils/consultarCep.js"

vi.mock("../src/utils/consultarCep.js", () => ({
    consultarCep: vi.fn()
}))

describe('API de montadoras', () => {
    beforeEach(async () => {
        await MontadoraFactory.create('Toyota', 'Japão')
        await MontadoraFactory.create('Honda', 'Japão')
        await MontadoraFactory.create('Nissan', 'Japão')

        vi.clearAllMocks();
    });

    afterEach(async () => {
        await clearDatabase();

        vi.resetAllMocks();
    })
    describe('Montadoras', () => {
        describe('Criação de montadoras', () => {
            it('Deve criar uma montadora com sucesso', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({
                        nome: 'Fiat',
                        pais: 'Itália'
                    })

                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('insertId');

            });

            it('Deve retornar erro ao criar montadora com nome curto demais', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({ nome: 'Fi', pais: 'Itália' })

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Nome inválido');
            });

            it('Deve tentar criar uma montadora (retorna erro) - parâmetros "país" vazio', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({
                        nome: 'Fiat',
                    })
                expect(response.status).toBe(500);

            });

            it('Deve tentar criar uma montadora (retorna erro) - parâmetros "nome" vazio', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({
                        pais: 'Itália'
                    })
                expect(response.status).toBe(500);

            });
        });
        describe('Atualização de montadoras', () => {
            it('Deve atualizar uma montadora com sucesso', async () => {
                const montadora = await MontadoraFactory.create('Nissan', 'Japão');

                const response = await request(app)
                    .put(`/montadoras/?id=${montadora.id}`)
                    .send({
                        nome: 'Mitsubushi',
                        pais: 'Japão'
                    });
                expect(response.status).toBe(200);
                expect(response._body.data.affectedRows >= 1).toBeTruthy();

            });

            it('Deve tentar atualizar uma montadora (retorna erro) - o id é inválido', async () => {
                const montadora = await MontadoraFactory.create('Nissan', 'Japão');

                const response = await request(app)
                    .put(`/montadoras/?id=r`)
                    .send({
                        nome: 'Mitsubushi',
                        pais: 'Japão'
                    });
                expect(response.status).toBe(404);
                expect(response._body.data.affectedRows = 0);

            });

            it('Deve retornar erro ao atualizar montadora com id negativo', async () => {
                const montadora = await MontadoraFactory.create('Nissan', 'Japão');

                const response = await request(app)
                    .put('/montadoras?id=-1')
                    .send({ nome: 'Mitsubishi', pais: 'Japão' });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('ID inválido');
            });

            it('Deve tentar criar uma montadora - parâmetros "nome" vazio', async () => {
                const response = await request(app)
                    .post('/montadoras')
                    .send({
                        pais: 'Itália'
                    })
                expect(response.status).toBe(500);

            });
        });
        describe('Procura de montadoras', () => {
            it('Deve listar as montadoras ordenadas por nome', async () => {
                const response = await request(app).get('/montadoras');

                expect(response.status).toBe(200);
                expect(response.body.data.map(m => m.Nome)).toEqual(['Honda', 'Nissan', 'Toyota']);
            });

            it('Deve retornar lista vazia quando não há montadoras', async () => {
                await clearDatabase();

                const response = await request(app).get('/montadoras');

                expect(response.status).toBe(200);
                expect(response.body.data).toEqual([]);
            });
        });

        describe('Exclusão', () => {
            it('Deve deletar uma montadora com sucesso', async () => {
                const montadora = await MontadoraFactory.create('Nissan', 'Japão');

                const response = await request(app).delete(`/montadoras/${montadora.id}`);

                expect(response.status).toBe(200);
                expect(response.body.data.affectedRows).toBe(1);
            });

            it('Deve retornar 404 ao deletar montadora inexistente', async () => {
                const response = await request(app).delete('/montadoras/999999');

                expect(response.status).toBe(404);
                expect(response.body.message).toBe('Montadora não encontrada');
            });
        });
    });
});

describe('API de clientes', () => {
    beforeEach(async () => {
        vi.mocked(consultarCep).mockResolvedValue({
            cep: '01001000',
            logradouro: 'Praça da Sé',
            bairro: 'Sé',
            cidade: 'São Paulo',
            uf: 'SP'
        });

        await ClienteFactory.create('João Silva', '12345678901', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '100', 'Apto 1');
        await ClienteFactory.create('Ana Lima', '12345678902', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '200', null);
        await ClienteFactory.create('Carlos Souza', '12345678903', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '300', 'Casa');

        vi.clearAllMocks();
        vi.mocked(consultarCep).mockResolvedValue({
            cep: '01001000',
            logradouro: 'Praça da Sé',
            bairro: 'Sé',
            cidade: 'São Paulo',
            uf: 'SP'
        });
    });

    afterEach(async () => {
        await clearDatabase();
        vi.resetAllMocks();
    });

    describe('Clientes', () => {
        describe('Criação de clientes', () => {
            it('Deve criar um cliente com sucesso', async () => {
                const response = await request(app)
                    .post('/clientes')
                    .send({
                        nome: 'Maria Oliveira',
                        cpf: '123.456.789-04',
                        cep: '01001-000',
                        numero: '400',
                        complemento: 'Bloco B'
                    });

                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('insertId');
            });

            it('Deve retornar erro ao criar cliente com nome curto demais', async () => {
                const response = await request(app)
                    .post('/clientes')
                    .send({
                        nome: 'Jo',
                        cpf: '12345678905',
                        cep: '01001000',
                        numero: '500',
                        complemento: null
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Nome inválido');
            });

            it('Deve retornar erro ao criar cliente com CEP inválido', async () => {
                vi.mocked(consultarCep).mockRejectedValueOnce(new Error('CEP inválido'));

                const response = await request(app)
                    .post('/clientes')
                    .send({
                        nome: 'Pedro Alves',
                        cpf: '12345678906',
                        cep: '123',
                        numero: '600',
                        complemento: null
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('CEP inválido');
            });

            it('Deve retornar erro ao criar cliente sem número', async () => {
                const response = await request(app)
                    .post('/clientes')
                    .send({
                        nome: 'Pedro Alves',
                        cpf: '12345678906',
                        cep: '01001000',
                        complemento: null
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Número inválido');
            });
        });

        describe('Atualização de clientes', () => {
            it('Deve atualizar um cliente com sucesso', async () => {
                const cliente = await ClienteFactory.create('Bruno Costa', '12345678907', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '700', null);

                const response = await request(app)
                    .put(`/clientes/?id=${cliente.id}`)
                    .send({
                        nome: 'Bruno Costa Atualizado',
                        cpf: '12345678907',
                        cep: '01001000',
                        numero: '701',
                        complemento: 'Fundos'
                    });

                expect(response.status).toBe(200);
                expect(response.body.data.affectedRows >= 1).toBeTruthy();
            });

            it('Deve retornar erro ao atualizar cliente com id negativo', async () => {
                const response = await request(app)
                    .put('/clientes?id=-1')
                    .send({
                        nome: 'Cliente Inválido',
                        cpf: '12345678908',
                        cep: '01001000',
                        numero: '800',
                        complemento: null
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('ID inválido');
            });

            it('Deve retornar erro ao atualizar cliente com CPF inválido', async () => {
                const cliente = await ClienteFactory.create('Lucas Lima', '12345678909', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '900', null);

                const response = await request(app)
                    .put(`/clientes/?id=${cliente.id}`)
                    .send({
                        nome: 'Lucas Lima',
                        cpf: '',
                        cep: '01001000',
                        numero: '900',
                        complemento: null
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('CPF inválido');
            });
        });

        describe('Procura de clientes', () => {
            it('Deve listar os clientes ordenados por nome', async () => {
                const response = await request(app).get('/clientes');

                expect(response.status).toBe(200);
                expect(response.body.data.map(c => c.Nome)).toEqual(['Ana Lima', 'Carlos Souza', 'João Silva']);
            });

            it('Deve retornar lista vazia quando não há clientes', async () => {
                await clearDatabase();

                const response = await request(app).get('/clientes');

                expect(response.status).toBe(200);
                expect(response.body.data).toEqual([]);
            });
        });

        describe('Exclusão de clientes', () => {
            it('Deve deletar um cliente com sucesso', async () => {
                const cliente = await ClienteFactory.create('Rita Dias', '12345678910', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '1000', null);

                const response = await request(app).delete(`/clientes/${cliente.id}`);

                expect(response.status).toBe(200);
                expect(response.body.data.affectedRows).toBe(1);
            });

            it('Deve retornar sucesso com affectedRows 0 ao deletar cliente inexistente', async () => {
                const response = await request(app).delete('/clientes/999999');

                expect(response.status).toBe(200);
                expect(response.body.data.affectedRows).toBe(0);
            });
        });
    });
});

describe('API de veículos', () => {
    beforeEach(async () => {
        const montadora = await MontadoraFactory.create('Toyota', 'Japão');
        const cliente = await ClienteFactory.create('João Silva', '12345678901', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '100', 'Apto 1');

        await VeiculoFactory.create('Corolla', 'ABC1D23', 2020, 'Preto', 90000, cliente.id, montadora.id);
        await VeiculoFactory.create('Etios', 'DEF4G56', 2019, 'Branco', 50000, cliente.id, montadora.id);
        await VeiculoFactory.create('Yaris', 'HIJ7K89', 2021, 'Prata', 80000, cliente.id, montadora.id);

        vi.clearAllMocks();
    });

    afterEach(async () => {
        await clearDatabase();
        vi.resetAllMocks();
    });

    describe('Veículos', () => {
        describe('Criação de veículos', () => {
            it('Deve criar um veículo com sucesso', async () => {
                const montadora = await MontadoraFactory.create('Honda', 'Japão');
                const cliente = await ClienteFactory.create('Ana Lima', '12345678902', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '200', null);

                const response = await request(app)
                    .post('/veiculos')
                    .send({
                        idMontadora: montadora.id,
                        idCliente: cliente.id,
                        modelo: 'Civic',
                        placa: 'LMN1O23',
                        ano: 2022,
                        cor: 'Azul',
                        valor: 120000
                    });

                expect(response.status).toBe(201);
                expect(response.body.data).toHaveProperty('insertId');
            });

            it('Deve retornar erro ao criar veículo com modelo curto demais', async () => {
                const montadora = await MontadoraFactory.create('Honda', 'Japão');
                const cliente = await ClienteFactory.create('Ana Lima', '12345678902', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '200', null);

                const response = await request(app)
                    .post('/veiculos')
                    .send({
                        idMontadora: montadora.id,
                        idCliente: cliente.id,
                        modelo: 'A',
                        placa: 'LMN1O23',
                        ano: 2022,
                        cor: 'Azul',
                        valor: 120000
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Modelo inválido');
            });

            it('Deve retornar erro ao criar veículo com valor inválido', async () => {
                const montadora = await MontadoraFactory.create('Honda', 'Japão');
                const cliente = await ClienteFactory.create('Ana Lima', '12345678902', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '200', null);

                const response = await request(app)
                    .post('/veiculos')
                    .send({
                        idMontadora: montadora.id,
                        idCliente: cliente.id,
                        modelo: 'Civic',
                        placa: 'LMN1O23',
                        ano: 2022,
                        cor: 'Azul',
                        valor: 0
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Valor inválido');
            });
        });

        describe('Atualização de veículos', () => {
            it('Deve atualizar um veículo com sucesso', async () => {
                const montadora = await MontadoraFactory.create('Nissan', 'Japão');
                const cliente = await ClienteFactory.create('Carlos Souza', '12345678903', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '300', 'Casa');
                const veiculo = await VeiculoFactory.create('Sentra', 'PQR1S23', 2018, 'Cinza', 70000, cliente.id, montadora.id);

                const response = await request(app)
                    .put(`/veiculos/?id=${veiculo.id}`)
                    .send({
                        idMontadora: montadora.id,
                        idCliente: cliente.id,
                        modelo: 'Sentra SL',
                        placa: 'PQR1S23',
                        ano: 2018,
                        cor: 'Preto',
                        valor: 75000
                    });

                expect(response.status).toBe(200);
                expect(response.body.data.affectedRows >= 1).toBeTruthy();
            });

            it('Deve retornar erro ao atualizar veículo com id negativo', async () => {
                const montadora = await MontadoraFactory.create('Nissan', 'Japão');
                const cliente = await ClienteFactory.create('Carlos Souza', '12345678903', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '300', 'Casa');

                const response = await request(app)
                    .put('/veiculos?id=-1')
                    .send({
                        idMontadora: montadora.id,
                        idCliente: cliente.id,
                        modelo: 'Sentra SL',
                        placa: 'PQR1S23',
                        ano: 2018,
                        cor: 'Preto',
                        valor: 75000
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('ID inválido');
            });

            it('Deve retornar erro ao atualizar veículo com placa inválida', async () => {
                const montadora = await MontadoraFactory.create('Nissan', 'Japão');
                const cliente = await ClienteFactory.create('Carlos Souza', '12345678903', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '300', 'Casa');
                const veiculo = await VeiculoFactory.create('Sentra', 'PQR1S23', 2018, 'Cinza', 70000, cliente.id, montadora.id);

                const response = await request(app)
                    .put(`/veiculos/?id=${veiculo.id}`)
                    .send({
                        idMontadora: montadora.id,
                        idCliente: cliente.id,
                        modelo: 'Sentra SL',
                        placa: '123',
                        ano: 2018,
                        cor: 'Preto',
                        valor: 75000
                    });

                expect(response.status).toBe(500);
                expect(response.body.error).toBe('Placa inválida');
            });
        });

        describe('Procura de veículos', () => {
            it('Deve listar os veículos ordenados por modelo', async () => {
                const response = await request(app).get('/veiculos');

                expect(response.status).toBe(200);
                expect(response.body.data.map(v => v.Modelo)).toEqual(['Corolla', 'Etios', 'Yaris']);
            });

            it('Deve retornar lista vazia quando não há veículos', async () => {
                await clearDatabase();

                const response = await request(app).get('/veiculos');

                expect(response.status).toBe(200);
                expect(response.body.data).toEqual([]);
            });
        });

        describe('Exclusão de veículos', () => {
            it('Deve deletar um veículo com sucesso', async () => {
                const montadora = await MontadoraFactory.create('Fiat', 'Itália');
                const cliente = await ClienteFactory.create('Rita Dias', '12345678910', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '1000', null);
                const veiculo = await VeiculoFactory.create('Argo', 'TUV1W23', 2023, 'Vermelho', 85000, cliente.id, montadora.id);

                const response = await request(app).delete(`/veiculos/${veiculo.id}`);

                expect(response.status).toBe(200);
                expect(response.body.data.affectedRows).toBe(1);
            });

            it('Deve retornar sucesso com affectedRows 0 ao deletar veículo inexistente', async () => {
                const response = await request(app).delete('/veiculos/999999');

                expect(response.status).toBe(200);
                expect(response.body.data.affectedRows).toBe(0);
            });
        });
    });
});