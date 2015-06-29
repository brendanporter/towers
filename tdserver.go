package main

import (
	"fmt"
	"net/http"
	"io/ioutil"
)

func main(){

	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/api", serveApi)
    http.ListenAndServe(":8080", nil)
}

func serveIndex(w http.ResponseWriter, r *http.Request){
	// Determine if we are fetching a specific file or just requesting index

	var data []byte
	switch  {
		case r.URL.Path[1:] == "":
			data, _ = ioutil.ReadFile("index.html")
			w.Header().Set("Content-Type", "text/html")

		case r.URL.Path[1:] == "jquery.js":
			data, _ = ioutil.ReadFile("jquery.js")
			w.Header().Set("Content-Type", "application/javascript")
		case r.URL.Path[1:] == "jquery.min.js":
			data, _ = ioutil.ReadFile("jquery.min.js")
			w.Header().Set("Content-Type", "application/javascript")

		case r.URL.Path[1:] == "game.js":
			data, _ = ioutil.ReadFile("game.js")
			w.Header().Set("Content-Type", "application/javascript")

		case r.URL.Path[1:] == "astar.js":
			data, _ = ioutil.ReadFile("astar.js")
			w.Header().Set("Content-Type", "application/javascript")

		case r.URL.Path[1:] == "favicon.ico":
			return
	}

	//fmt.Println(r.URL.Path[1:]) // Log the requested file

	w.Write(data)
}

func serveApi(w http.ResponseWriter, r *http.Request){
	r.ParseForm()
	postVars := r.Form

	switch {
		case postVars.Get("action") == "log":
			fmt.Println("API logged: " + postVars.Get("message"))
	}
}