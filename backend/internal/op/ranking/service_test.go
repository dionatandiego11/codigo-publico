package ranking

import "testing"

func TestHasGeneralInstitutionalRole(t *testing.T) {
	tests := []struct {
		role string
		want bool
	}{
		{role: "citizen", want: false},
		{role: "sysadmin", want: true},
		{role: "admin", want: true},
		{role: "institutional_admin", want: true},
		{role: "legislative_admin", want: true},
		{role: "vereador", want: true},
		{role: "mesa_diretora", want: true},
	}

	for _, tt := range tests {
		t.Run(tt.role, func(t *testing.T) {
			if got := hasGeneralInstitutionalRole(tt.role); got != tt.want {
				t.Fatalf("hasGeneralInstitutionalRole(%q) = %v; want %v", tt.role, got, tt.want)
			}
		})
	}
}
