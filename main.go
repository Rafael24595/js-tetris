package main

import (
	"io"
	"log"
	"os"
	"text/template"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type TemplateRenderer struct {
	templates *template.Template
}

func (t *TemplateRenderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	return t.templates.ExecuteTemplate(w, name, data)
}

func main() {
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "1196"
	}

	tmpl, err := template.ParseGlob(
		"./assets/template/*.html",
	)
	if err != nil {
		log.Fatal("Could not load template files: ", err)
	}

	e := echo.New()
	e.Renderer = &TemplateRenderer{
		templates: tmpl,
	}

	e.Use(middleware.Logger())
	e.Static("/static", "./assets")

	e.GET("/", index)

	e.Logger.Fatal(e.Start(":" + port))
}

func index(c echo.Context) error {
	return c.Render(200, "index.html", make(map[string]interface{}))
}