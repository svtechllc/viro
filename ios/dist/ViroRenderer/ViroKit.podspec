Pod::Spec.new do |s|
  s.name                = 'ViroKit'
  s.version             = '1.0'
  s.summary             = 'Framework containing the ViroRenderer'
  s.description         = <<-DESC
    ViroKit is the core rendering framework for ViroReact.

    This custom ViroKit build bundles ARCore iOS SDK 1.56.0 and the required
    resource bundles for Cloud Anchors, Geospatial, and Scene Semantics.
    Applications must not add a second copy of the ARCore CocoaPods dependencies.
  DESC
  s.source              = { :path => '.' } # source is required, but path will be defined in user's Podfile (this value will be ignored).
  s.vendored_frameworks = 'ViroKit.framework'
  s.homepage            = 'https://reactvision.xyz'
  s.license             = {:type => 'Copyright', :text => "Copyright 2025 ReactVision" }
  s.author              = 'ReactVision'
  s.requires_arc        = true
  s.platform            = :ios, '15.0'
  s.visionos.deployment_target = '1.0'
  s.dependency 'React'

  # visionOS requires CompositorServices for the immersive render loop.
  # Metal and MetalKit are available on both iOS and visionOS.
  s.visionos.frameworks = ['Metal', 'MetalKit', 'CompositorServices', 'ARKit']

end
