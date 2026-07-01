package demands

import "time"

type actor struct {
	ID          string
	Name        string
	Role        string
	TerritoryID string
}

type DemandComment struct {
	ID         string `json:"id"`
	AuthorName string `json:"authorName"`
	Content    string `json:"content"`
	CreatedAt  string `json:"createdAt"`
}

type DemandLink struct {
	Type         string `json:"type"`
	DemandID     string `json:"demandId"`
	DemandTitle  string `json:"demandTitle"`
	DemandStatus string `json:"demandStatus"`
	Reason       string `json:"reason"`
	CreatedAt    string `json:"createdAt"`
}

type DemandEvent struct {
	ID         string         `json:"id"`
	DemandID   string         `json:"demandId"`
	ActorID    *string        `json:"actorId,omitempty"`
	ActorType  string         `json:"actorType"`
	Type       string         `json:"type"`
	FromState  *string        `json:"fromState,omitempty"`
	ToState    *string        `json:"toState,omitempty"`
	Visibility string         `json:"visibility"`
	Payload    map[string]any `json:"payload"`
	CreatedAt  time.Time      `json:"createdAt"`
}

type Demand struct {
	ID                     string          `json:"id"`
	CycleID                string          `json:"cycleId"`
	TerritoryID            string          `json:"territoryId"`
	TerritoryName          string          `json:"territoryName"`
	Title                  string          `json:"title"`
	Description            string          `json:"description"`
	Location               string          `json:"location"`
	Category               string          `json:"category"`
	AuthorName             string          `json:"authorName"`
	Status                 string          `json:"status"`
	Supports               int             `json:"supports"`
	SupportThreshold       int             `json:"supportThreshold"`
	SupportProgressPercent float64         `json:"supportProgressPercent"`
	SupportReached         bool            `json:"supportReached"`
	GroupedIntoDemandID    *string         `json:"groupedIntoDemandId,omitempty"`
	ForkedFromDemandID     *string         `json:"forkedFromDemandId,omitempty"`
	Links                  []DemandLink    `json:"links"`
	Comments               []DemandComment `json:"comments"`
	Events                 []DemandEvent   `json:"events,omitempty"`
	CreatedAt              string          `json:"createdAt"`
	UpdatedAt              string          `json:"updatedAt"`
}

type createDemandInput struct {
	TerritoryID string `json:"territoryId"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Location    string `json:"location"`
	Category    string `json:"category"`
}

type createCommentInput struct {
	Content string `json:"content"`
}

type transitionInput struct {
	Reason string `json:"reason"`
}

type groupDemandInput struct {
	TargetDemandID string `json:"targetDemandId"`
	Reason         string `json:"reason"`
}

type forkDemandInput struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Location    string `json:"location"`
	Category    string `json:"category"`
	Reason      string `json:"reason"`
}

