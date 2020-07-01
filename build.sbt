import sbt.Keys.publish

organization in ThisBuild := "io.github.tetherless-world"
scalaVersion in ThisBuild := "2.12.10"
version in ThisBuild := "1.0.0-SNAPSHOT"


// Test settings
parallelExecution in ThisBuild := false


// Resolvers
resolvers in ThisBuild += Resolver.sonatypeRepo("snapshots")


lazy val geoApp = (project in file("."))
  .enablePlugins(PlayScala)
  .settings(
    libraryDependencies ++= Seq(
      organization.value %% "twxplore-geo-lib" % version.value % "compile->compile",
      organization.value %% "twxplore-test-lib" % version.value % Test,
    ),
    name := "geo-app",
    routesGenerator := InjectedRoutesGenerator,
    // Adds additional packages into Twirl
    //TwirlKeys.templateImports += "com.example.controllers._"

    // Adds additional packages into conf/routes
    // play.sbt.routes.RoutesKeys.routesImport += "com.example.binders._"
    skip in publish := true
  )
