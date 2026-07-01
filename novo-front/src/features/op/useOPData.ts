import { useEffect, useState } from 'react';
import {
  INITIAL_CYCLE,
  INITIAL_DEMANDAS,
  INITIAL_TERRITORIOS,
  calcularOrcamentoTerritorios,
} from '../../demo/initialData';
import { CycleConfig, Demanda, Territorio } from '../../shared/domain/types';
import { isNotFound } from '../../shared/api/client';
import { mapCycle, mapDemand, mapRankingItem, mapTerritories } from './adapters';
import { opApi, type ApiBudgetDemand, type ApiCycle, type ApiCycleTerritoryEnvelope, type ApiRankingItem, type ApiCycleResultSnapshot } from './api';

export function useOPData() {
  const [cycle, setCycle] = useState<CycleConfig>(INITIAL_CYCLE);
  const [territorios, setTerritorios] = useState<Territorio[]>(
    calcularOrcamentoTerritorios(INITIAL_TERRITORIOS, INITIAL_CYCLE.pisoIgualBase, INITIAL_CYCLE.parcelaCarenciaTotal),
  );
  const [demandas, setDemandas] = useState<Demanda[]>(INITIAL_DEMANDAS);
  const [ranking, setRanking] = useState<import('../../shared/domain/types').RankingItem[]>([]);
  const [cycleSnapshot, setCycleSnapshot] = useState<ApiCycleResultSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCodigoPublico() {
      try {
        const apiTerritories = await opApi.territories();

        let apiCycle: ApiCycle | undefined;
        try {
          apiCycle = await opApi.currentCycle();
        } catch (error) {
          if (!isNotFound(error)) throw error;
        }

        const nextCycle = apiCycle ? mapCycle(apiCycle, apiTerritories.length) : INITIAL_CYCLE;

        let envelopes: ApiCycleTerritoryEnvelope[] = [];
        if (apiCycle) {
          try {
            envelopes = await opApi.cycleTerritoryEnvelopes(apiCycle.id);
          } catch (error) {
            console.warn('Não foi possível carregar sub-envelopes territoriais.', error);
          }
        }

        let apiDemands: ApiBudgetDemand[] = [];
        try {
          apiDemands = await opApi.demands();
        } catch (error) {
          console.warn('Não foi possível carregar demandas OP.', error);
        }

        let apiRanking: ApiRankingItem[] = [];
        if (apiCycle) {
          try {
            apiRanking = await opApi.ranking(apiCycle.id);
          } catch (error) {
            console.warn('Não foi possível carregar o ranking.', error);
          }
        }

        let apiSnapshot: ApiCycleResultSnapshot | null = null;
        if (apiCycle) {
          try {
            apiSnapshot = await opApi.cycleResults(apiCycle.id);
          } catch (error) {
            console.warn('Não foi possível carregar o snapshot do ciclo.', error);
          }
        }

        const mappedTerritorios = mapTerritories(apiTerritories, envelopes, nextCycle);
        const mappedDemandas = apiDemands.map(demand => mapDemand(demand, mappedTerritorios));
        const mappedRanking = apiRanking.map(mapRankingItem);

        if (!isMounted) return;
        setCycle(nextCycle);
        setTerritorios(mappedTerritorios);
        setDemandas(mappedDemandas);
        setRanking(mappedRanking);
        setCycleSnapshot(apiSnapshot);
      } catch (error) {
        console.warn('API indisponível; usando dados locais de demonstração.', error);
        if (!isMounted) return;
        setCycle(INITIAL_CYCLE);
        setTerritorios(calcularOrcamentoTerritorios(INITIAL_TERRITORIOS, INITIAL_CYCLE.pisoIgualBase, INITIAL_CYCLE.parcelaCarenciaTotal));
        setDemandas(INITIAL_DEMANDAS);
        setCycleSnapshot(null);
      }
    }

    void loadCodigoPublico();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    cycle,
    setCycle,
    territorios,
    setTerritorios,
    demandas,
    setDemandas,
    ranking,
    setRanking,
    cycleSnapshot,
    setCycleSnapshot,
  };
}
