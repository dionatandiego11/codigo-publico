package publicapi

import "testing"

// A resolução da votação é a regra que o encerramento automático aplica.
func TestVotingResolutionTrigger(t *testing.T) {
	sm := NewPRStateMachine()

	cases := []struct {
		name                                      string
		quorumNeeded, quorumReached, yes, no      int
		want                                      string
	}{
		{"quórum + maioria favorável", 5000, 5120, 4520, 480, "quorum_e_maioria_favoravel"},
		{"sem quórum", 5000, 4000, 100, 10, "votacao_encerrada_sem_aprovacao"},
		{"empate", 10, 10, 5, 5, "votacao_encerrada_sem_aprovacao"},
		{"maioria contrária", 10, 10, 3, 7, "votacao_encerrada_sem_aprovacao"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := sm.VotingResolutionTrigger(tc.quorumNeeded, tc.quorumReached, tc.yes, tc.no); got != tc.want {
				t.Errorf("trigger = %q, esperava %q", got, tc.want)
			}
		})
	}
}

// O gatilho precisa mapear, a partir de "Em votação", para o estado correto do PR.
func TestVotingResolutionTransitions(t *testing.T) {
	sm := NewPRStateMachine()

	favorable, err := sm.TransitionByTrigger(prStatusVoting, "quorum_e_maioria_favoravel", "system", false)
	if err != nil {
		t.Fatalf("transição favorável inválida: %v", err)
	}
	if favorable.ToStatus != prStatusApprovedByPublicConsult {
		t.Errorf("favorável -> %q, esperava %q", favorable.ToStatus, prStatusApprovedByPublicConsult)
	}

	rejected, err := sm.TransitionByTrigger(prStatusVoting, "votacao_encerrada_sem_aprovacao", "system", false)
	if err != nil {
		t.Fatalf("transição de rejeição inválida: %v", err)
	}
	if rejected.ToStatus != prStatusRejected {
		t.Errorf("sem aprovação -> %q, esperava %q", rejected.ToStatus, prStatusRejected)
	}

	// Um cidadão comum não pode disparar a resolução de sistema.
	if _, err := sm.TransitionByTrigger(prStatusVoting, "quorum_e_maioria_favoravel", "citizen", false); err == nil {
		t.Error("cidadão não deveria disparar a resolução de sistema")
	}
}
