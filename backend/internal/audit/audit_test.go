package audit

import "testing"

func sampleActor() Actor {
	return Actor{ID: "11111111-1111-1111-1111-111111111111", Name: "Maria", Role: "citizen", Type: "citizen"}
}

func sampleEvent() Event {
	return Event{
		Action:         "bond.requested",
		EntityType:     "territory_bond",
		EntityID:       "22222222-2222-2222-2222-222222222222",
		EntityPublicID: "22222222-2222-2222-2222-222222222222",
	}
}

// O hash deve ser determinístico: mesmas entradas, mesma saída.
func TestHashEventIsDeterministic(t *testing.T) {
	a := hashEvent("prev", sampleActor(), sampleEvent(), `{"k":"v"}`)
	b := hashEvent("prev", sampleActor(), sampleEvent(), `{"k":"v"}`)
	if a != b {
		t.Fatalf("hash não determinístico: %s != %s", a, b)
	}
	if len(a) != 64 {
		t.Fatalf("esperava SHA-256 hex de 64 chars, obtive %d", len(a))
	}
}

// O encadeamento é real: trocar o prev_hash muda o hash do evento — é isso que
// torna a cadeia verificável (alterar o passado quebra o futuro).
func TestHashEventChainsOnPrevHash(t *testing.T) {
	genesis := hashEvent("", sampleActor(), sampleEvent(), `{}`)
	chained := hashEvent(genesis, sampleActor(), sampleEvent(), `{}`)

	if genesis == chained {
		t.Fatal("hash deveria mudar quando o prev_hash muda")
	}

	// Reencadear a partir de um prev_hash adulterado produz outro resultado.
	tampered := hashEvent("hash-adulterado", sampleActor(), sampleEvent(), `{}`)
	if chained == tampered {
		t.Fatal("prev_hash diferente deveria produzir event_hash diferente")
	}
}

// Qualquer campo material do evento altera o hash.
func TestHashEventIsSensitiveToContent(t *testing.T) {
	baseline := hashEvent("prev", sampleActor(), sampleEvent(), `{}`)

	otherActor := sampleActor()
	otherActor.ID = "33333333-3333-3333-3333-333333333333"
	if hashEvent("prev", otherActor, sampleEvent(), `{}`) == baseline {
		t.Error("mudar o ator deveria mudar o hash")
	}

	otherEvent := sampleEvent()
	otherEvent.Action = "bond.approved"
	if hashEvent("prev", sampleActor(), otherEvent, `{}`) == baseline {
		t.Error("mudar a ação deveria mudar o hash")
	}

	if hashEvent("prev", sampleActor(), sampleEvent(), `{"k":"v"}`) == baseline {
		t.Error("mudar o metadata deveria mudar o hash")
	}
}
